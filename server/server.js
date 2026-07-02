import './loadEnv.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express        from 'express'
import cors           from 'cors'
import session        from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { pool }       from './db.js'
import authRouter     from './auth.js'
import { createEmailTransporter, getEmailConfig } from './emailTransport.js'
import {
  createSigningGroup,
  getLease,
  getSigningGroupForDocument,
  getSigningTokens,
  ensureDualSigningGroup,
  buildSigningSummary,
  signLease,
  deleteLeasesByDocumentId,
} from './leaseStore.js'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentMeta,
  getDecryptedLease,
  buildMaskedPreview,
  markDocumentPaid,
  isDocumentPaid,
  unlockAllPendingIfBypassed,
  verifyDocumentAccess,
  setDocumentRecoveryPassword,
  unlockDocumentWithPassword,
} from './documentStore.js'
import { documentRateLimit, unlockRateLimit } from './rateLimit.js'
import { isDocumentIdOnlyAccess, isRecoveryPasswordEnabled } from './documentAccessPolicy.js'
import { recordUserDocument, userOwnsDocument, updateDocumentRecord } from './documentOwnership.js'
import { APP_NAME } from './brand.js'
import {
  stripeEnabled,
  isPaymentsEnabled,
  isPaymentBypassed,
  createCheckoutSession,
  verifyCheckoutSession,
  handleWebhook,
  getPriceDisplay,
} from './stripe.js'
import { getComments, addComment } from './commentStore.js'
import { recordScreeningClick } from './screeningEventStore.js'
import { getStateLawBundle, listStateLawCodes } from './stateLawService.js'
import { DEFAULT_API_PORT } from '../src/config/apiPort.js'

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.DOCUMENT_ENCRYPTION_KEY) {
  console.error('[config] DOCUMENT_ENCRYPTION_KEY is required in production (openssl rand -hex 32)')
  process.exit(1)
}

const app  = express()
const PORT = process.env.API_PORT || DEFAULT_API_PORT
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

app.use(cors({
  origin: APP_URL,
  credentials: true,
}))

// ── Sessions (stored in docucreate.sessions) ──────────────────
const PgSession = connectPgSimple(session)
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'sessions',
    schemaName: 'docucreate',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}))

const SENSITIVE_API = /^\/api\/(documents|lease)(\/|$)/

app.use((req, res, next) => {
  if (SENSITIVE_API.test(req.path)) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
  }
  next()
})

// Stripe webhook must receive raw body — register before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']
    const result = await handleWebhook(req.body, sig)
    if (result.documentId) {
      markDocumentPaid(result.documentId, { stripeSessionId: result.stripeSessionId })
      updateDocumentRecord(result.documentId, { paid: true }).catch(err =>
        console.error('[stripe] failed to sync paid to db', err.message)
      )
      console.log(`[stripe] Document ${result.documentId} marked paid`)
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[/api/stripe/webhook]', err.message)
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json({ limit: '5mb' }))

// ── Auth routes ───────────────────────────────────────────────
app.use('/api/auth', authRouter)

const emailConfig = getEmailConfig()
const { EMAIL_USER } = emailConfig
const { method: authMethod, transporter } = createEmailTransporter(emailConfig)

let emailMode = transporter ? 'smtp' : 'mock'

if (transporter) {
  transporter.verify()
    .then(() => { emailMode = 'smtp'; console.log(`[email] SMTP ready (${authMethod}) — ${EMAIL_USER}`) })
    .catch(err  => { emailMode = 'mock'; console.warn(`[email] SMTP unavailable — mock mode. ${err.message}`) })
} else {
  console.warn('[email] No transporter configured — mock mode. Set EMAIL_USER + credentials in .env')
}

async function sendMail(options) {
  if (emailMode === 'mock') {
    if (isProduction) {
      throw new Error('Email is not configured. Set EMAIL_USER and Google OAuth or app password in .env')
    }
    console.log('[email:mock]', { to: options.to, subject: options.subject })
    return { messageId: `mock-${Date.now()}` }
  }
  return transporter.sendMail(options)
}

function getDocumentAccessToken(req) {
  return req.headers['x-doc-access'] || req.body?.accessToken || null
}

function denyDocumentAccess(res, result) {
  if (result.reason === 'not_found') {
    return res.status(404).json({ error: 'Document not found' })
  }
  const code = result.reason === 'token_required' ? 'ACCESS_TOKEN_REQUIRED' : 'INVALID_ACCESS_TOKEN'
  return res.status(403).json({ error: 'Access denied', code })
}

async function assertDocumentAccess(req, res, documentId) {
  if (!documentId) return null
  if (isDocumentIdOnlyAccess()) {
    if (!getDocumentMeta(documentId)) {
      denyDocumentAccess(res, { reason: 'not_found' })
      return false
    }
    return true
  }
  if (req.session?.userId && await userOwnsDocument(req.session.userId, documentId)) {
    return true
  }
  const result = verifyDocumentAccess(documentId, getDocumentAccessToken(req))
  if (!result.ok) {
    denyDocumentAccess(res, result)
    return false
  }
  return true
}

app.use('/api/documents', documentRateLimit)
app.use('/api/lease/send', documentRateLimit)
app.use('/api/lease/resend', documentRateLimit)

// ─────────────────────────────────────────────────────────────
// POST /api/documents/create
// Store encrypted lease server-side; client only gets document ID
// ─────────────────────────────────────────────────────────────
app.post('/api/documents/create', async (req, res) => {
  const { leaseData } = req.body
  if (!leaseData?.tenantName || !leaseData?.landlordName) {
    return res.status(400).json({ error: 'Incomplete lease data' })
  }
  const { id: documentId, accessToken } = createDocument(leaseData)

  if (req.session?.userId) {
    try {
      await recordUserDocument(req.session.userId, documentId, leaseData)
    } catch (err) {
      console.error('[documents] failed to record in db', err.message)
    }
  }

  res.json({
    documentId,
    accessToken,
    paymentRequired: !isPaymentBypassed(),
    price: getPriceDisplay(),
  })
})

// ─────────────────────────────────────────────────────────────
// POST /api/documents/unlock — landlord recovery password (no session token required)
// ─────────────────────────────────────────────────────────────
app.post('/api/documents/unlock', unlockRateLimit, (req, res) => {
  if (!isRecoveryPasswordEnabled()) {
    return res.status(503).json({ error: 'Recovery PIN is disabled. Open the lease with its document ID instead.' })
  }

  const { documentId, password } = req.body
  if (!documentId?.trim() || !password) {
    return res.status(400).json({ error: 'Document ID and PIN are required' })
  }

  const result = unlockDocumentWithPassword(documentId.trim(), password)
  if (!result.ok) {
    return res.status(401).json({ error: 'Invalid document ID or PIN' })
  }

  res.json({ documentId: documentId.trim(), accessToken: result.accessToken })
})

// ─────────────────────────────────────────────────────────────
// POST /api/documents/:id/recovery-password — set landlord recovery password
// ─────────────────────────────────────────────────────────────
app.post('/api/documents/:id/recovery-password', async (req, res) => {
  if (!isRecoveryPasswordEnabled()) {
    return res.status(503).json({ error: 'Recovery PIN is disabled while DOCUMENT_ID_ACCESS is enabled.' })
  }
  if (!await assertDocumentAccess(req, res, req.params.id)) return

  const { password } = req.body
  const result = setDocumentRecoveryPassword(req.params.id, password)
  if (result.error) return res.status(result.status).json({ error: result.error })

  res.json({ ok: true, hasRecoveryPassword: true })
})

// ─────────────────────────────────────────────────────────────
// GET /api/documents/:id/edit
// Full lease data for wizard pre-fill (document ID is the access token)
// ─────────────────────────────────────────────────────────────
app.get('/api/documents/:id/edit', async (req, res) => {
  if (!await assertDocumentAccess(req, res, req.params.id)) return

  const meta = getDocumentMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Document not found' })

  const leaseData = getDecryptedLease(req.params.id)
  if (!leaseData) return res.status(500).json({ error: 'Document could not be read' })

  res.json({ documentId: req.params.id, leaseData })
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/documents/:id — update stored lease after wizard edit
// ─────────────────────────────────────────────────────────────
app.patch('/api/documents/:id', async (req, res) => {
  if (!await assertDocumentAccess(req, res, req.params.id)) return

  const { leaseData } = req.body
  if (!leaseData?.tenantName || !leaseData?.landlordName) {
    return res.status(400).json({ error: 'Incomplete lease data' })
  }
  if (!updateDocument(req.params.id, leaseData)) {
    return res.status(404).json({ error: 'Document not found' })
  }

  // Keep DB record title + lease_type in sync with edited content
  if (req.session?.userId) {
    recordUserDocument(req.session.userId, req.params.id, leaseData).catch(err =>
      console.error('[documents/patch] failed to sync to db', err.message)
    )
  }

  res.json({ documentId: req.params.id })
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/documents/:id — remove stored lease (document ID is the access token)
// ─────────────────────────────────────────────────────────────
app.delete('/api/documents/:id', async (req, res) => {
  if (!await assertDocumentAccess(req, res, req.params.id)) return

  const meta = getDocumentMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Document not found' })

  deleteDocument(req.params.id)
  deleteLeasesByDocumentId(req.params.id)
  res.json({ deleted: true, documentId: req.params.id })
})

// ─────────────────────────────────────────────────────────────
// GET /api/documents/:id
// Unpaid → masked preview only. Paid → full lease data.
// ─────────────────────────────────────────────────────────────
app.get('/api/documents/:id', async (req, res) => {
  if (!await assertDocumentAccess(req, res, req.params.id)) return

  const meta = getDocumentMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Document not found' })

  const bypassed = isPaymentBypassed()
  const paid = isDocumentPaid(req.params.id) || bypassed
  const leaseData = getDecryptedLease(req.params.id)
  if (!leaseData) return res.status(500).json({ error: 'Document could not be read' })

  const deliverFullLease = paid || bypassed

  res.json({
    ...meta,
    paid: isDocumentPaid(req.params.id) || bypassed,
    paymentBypassed: bypassed,
    paymentsEnabled: isPaymentsEnabled(),
    price: getPriceDisplay(),
    leaseData: deliverFullLease ? leaseData : buildMaskedPreview(leaseData),
    signing: deliverFullLease ? buildSigningSummary(req.params.id) : null,
  })
})

// ─────────────────────────────────────────────────────────────
// POST /api/documents/:id/verify-payment
// Called after Stripe redirect with session_id
// ─────────────────────────────────────────────────────────────
app.post('/api/documents/:id/verify-payment', async (req, res) => {
  if (!await assertDocumentAccess(req, res, req.params.id)) return

  if (isPaymentBypassed()) {
    markDocumentPaid(req.params.id, {})
    updateDocumentRecord(req.params.id, { paid: true }).catch(err =>
      console.error('[verify-payment] failed to sync paid to db', err.message)
    )
    const leaseData = getDecryptedLease(req.params.id)
    return res.json({ paid: true, bypassed: true, leaseData })
  }

  const { sessionId } = req.body
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

  const result = await verifyCheckoutSession(sessionId, req.params.id)
  if (!result.paid) return res.status(402).json({ error: result.error })

  markDocumentPaid(req.params.id, { stripeSessionId: sessionId })
  updateDocumentRecord(req.params.id, { paid: true }).catch(err =>
    console.error('[verify-payment] failed to sync paid to db', err.message)
  )
  const leaseData = getDecryptedLease(req.params.id)
  res.json({ paid: true, leaseData })
})

// ─────────────────────────────────────────────────────────────
// POST /api/stripe/create-checkout-session
// ─────────────────────────────────────────────────────────────
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const { documentId } = req.body
  if (!documentId) return res.status(400).json({ error: 'documentId required' })
  if (!await assertDocumentAccess(req, res, documentId)) return

  const meta = getDocumentMeta(documentId)
  if (!meta) return res.status(404).json({ error: 'Document not found' })
  if (isDocumentPaid(documentId)) {
    return res.status(400).json({ error: 'Document already paid' })
  }

  if (isPaymentBypassed()) {
    markDocumentPaid(documentId, {})
    return res.json({ bypassed: true, url: `${APP_URL}/preview/${documentId}` })
  }

  if (!stripeEnabled) {
    return res.status(503).json({ error: 'Payments not configured. Set STRIPE_SECRET_KEY in .env' })
  }

  try {
    const session = await createCheckoutSession({ documentId, appUrl: APP_URL })
    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('[/api/stripe/create-checkout-session]', err.message)
    res.status(500).json({ error: 'Could not create checkout session' })
  }
})

function signButtonHtml(url, label) {
  return `
    <p style="margin:32px 0">
      <a href="${url}"
         style="background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
        ${label}
      </a>
    </p>`
}

function signingEmailFooter() {
  return `
    <p style="color:#6b7280;font-size:13px">
      If you did not expect this email, you can safely ignore it.<br/>
      This link is unique to you — do not share it.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="color:#9ca3af;font-size:11px">
      Generated by ${APP_NAME}. This document is for informational purposes only.
      Consult a licensed attorney before execution.
    </p>`
}

async function sendTenantSigningInvite(data, url, { reminder = false } = {}) {
  const intro = reminder
    ? '<p>This is a reminder to sign your room rental lease electronically.</p>'
    : '<p>Please click the button below to review and sign the lease electronically.</p>'

  await sendMail({
    from:    `"${APP_NAME}" <${EMAIL_USER}>`,
    to:      data.tenantEmail,
    subject: reminder
      ? `Reminder: Please Sign Your Room Rental Lease`
      : `Action Required: Please Sign Your Room Rental Lease`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#2563eb;margin-bottom:4px">Room Rental Lease — Signature Required</h2>
        <p>Hi ${data.tenantName || 'there'},</p>
        <p>
          <strong>${data.landlordName}</strong> has prepared a room rental lease agreement
          for the property at <strong>${data.propertyAddress}</strong>.
        </p>
        ${intro}
        ${signButtonHtml(url, 'Review &amp; Sign Lease →')}
        ${signingEmailFooter()}
      </div>
    `,
  })
}

async function sendLandlordSigningInvite(data, url, { reminder = false } = {}) {
  const intro = reminder
    ? '<p>This is a reminder to sign your copy of the lease. Both parties must sign.</p>'
    : '<p>Both parties must sign. Use the button below to review and sign your copy of the lease.</p>'

  await sendMail({
    from:    `"${APP_NAME}" <${EMAIL_USER}>`,
    to:      data.landlordEmail,
    subject: reminder
      ? `Reminder: Sign Your Room Rental Lease`
      : `Action Required: Sign Your Room Rental Lease`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#2563eb;margin-bottom:4px">Room Rental Lease — Your Signature Required</h2>
        <p>Hi ${data.landlordName || 'there'},</p>
        <p>
          You sent a room rental lease for <strong>${data.propertyAddress}</strong>
          to <strong>${data.tenantName}</strong> for electronic signature.
        </p>
        ${intro}
        ${signButtonHtml(url, 'Review &amp; Sign as Landlord →')}
        ${signingEmailFooter()}
      </div>
    `,
  })
}

// ─────────────────────────────────────────────────────────────
// POST /api/lease/send
// ─────────────────────────────────────────────────────────────
app.post('/api/lease/send', async (req, res) => {
  const { leaseData, documentId } = req.body

  let data = leaseData
  if (documentId) {
    if (!await assertDocumentAccess(req, res, documentId)) return
    if (!isDocumentPaid(documentId) && !isPaymentBypassed()) {
      return res.status(402).json({ error: 'Payment required before sending for signature' })
    }
    const existing = getSigningGroupForDocument(documentId)
    if (existing) {
      return res.status(409).json({
        error: 'This lease was already sent for signature. Use resend to email the links again.',
        code: 'ALREADY_SENT',
        signing: buildSigningSummary(documentId),
      })
    }
    data = getDecryptedLease(documentId)
  }

  if (!data?.tenantEmail) {
    return res.status(400).json({ error: 'Missing leaseData or tenantEmail' })
  }
  if (!data?.landlordEmail) {
    return res.status(400).json({ error: 'Missing landlordEmail' })
  }

  const { tenantToken, landlordToken } = createSigningGroup(data, { documentId: documentId ?? null })
  const tenantUrl   = `${APP_URL}/sign/${tenantToken}`
  const landlordUrl = `${APP_URL}/sign/${landlordToken}`

  try {
    await sendTenantSigningInvite(data, tenantUrl)
    await sendLandlordSigningInvite(data, landlordUrl)
    if (documentId) {
      updateDocumentRecord(documentId, { status: 'sent' }).catch(err =>
        console.error('[lease/send] failed to sync status to db', err.message)
      )
    }
    res.json({ success: true, tenantToken, landlordToken })
  } catch (err) {
    console.error('[/api/lease/send]', err.message)
    res.status(500).json({ error: 'Failed to send email.' })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/lease/resend
// ─────────────────────────────────────────────────────────────
app.post('/api/lease/resend', async (req, res) => {
  const { documentId, party = 'all' } = req.body

  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required' })
  }
  if (!await assertDocumentAccess(req, res, documentId)) return
  if (!['all', 'tenant', 'landlord'].includes(party)) {
    return res.status(400).json({ error: 'party must be all, tenant, or landlord' })
  }
  if (!isDocumentPaid(documentId) && !isPaymentBypassed()) {
    return res.status(402).json({ error: 'Payment required before resending signature emails' })
  }

  const group = ensureDualSigningGroup(documentId)
  if (!group) {
    return res.status(404).json({ error: 'No signature request found. Send for e-signature first.' })
  }
  if (group.fullyExecuted) {
    return res.status(400).json({ error: 'This lease is already fully signed.' })
  }

  const data = getDecryptedLease(documentId)
  if (!data?.tenantEmail || !data?.landlordEmail) {
    return res.status(400).json({ error: 'Missing tenant or landlord email on this lease' })
  }

  const tenantUrl = `${APP_URL}/sign/${group.tenantToken}`
  const landlordUrl = group.landlordToken ? `${APP_URL}/sign/${group.landlordToken}` : null

  const toEmail = []
  if ((party === 'all' || party === 'tenant') && !group.tenantSigned) toEmail.push('tenant')
  if ((party === 'all' || party === 'landlord') && !group.landlordSigned && landlordUrl) {
    toEmail.push('landlord')
  }

  if (!toEmail.length) {
    return res.status(400).json({ error: 'No pending signatures to resend for the selected party.' })
  }

  try {
    if (toEmail.includes('tenant')) await sendTenantSigningInvite(data, tenantUrl, { reminder: true })
    if (toEmail.includes('landlord')) await sendLandlordSigningInvite(data, landlordUrl, { reminder: true })

    res.json({
      success: true,
      emailed: toEmail,
      tenantToken: group.tenantToken,
      landlordToken: group.landlordToken,
      signing: buildSigningSummary(documentId),
    })
  } catch (err) {
    console.error('[/api/lease/resend]', err.message)
    res.status(500).json({ error: 'Failed to resend email.' })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/lease/:token
// ─────────────────────────────────────────────────────────────
app.get('/api/lease/:token', (req, res) => {
  const lease = getLease(req.params.token)
  if (!lease) return res.status(404).json({ error: 'Lease not found or link has expired.' })
  res.json(lease)
})

// ─────────────────────────────────────────────────────────────
// POST /api/lease/:token/sign
// ─────────────────────────────────────────────────────────────
app.post('/api/lease/:token/sign', async (req, res) => {
  const { printedName, signatureData } = req.body
  if (!printedName?.trim()) return res.status(400).json({ error: 'Printed name is required.' })

  const lease = signLease(req.params.token, { printedName, signatureData })
  if (!lease) return res.status(404).json({ error: 'Lease not found.' })
  if (lease.alreadySigned) return res.status(400).json({ error: 'You have already signed this lease.' })

  const d = lease.leaseData
  const party = lease.party || 'tenant'
  const signedAt = party === 'landlord'
    ? lease.landlordSignedAt
    : lease.tenantSignedAt
  const signedAtLabel = new Date(signedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })

  if (lease.documentId) {
    const docData = getDecryptedLease(lease.documentId)
    if (docData) {
      updateDocument(lease.documentId, {
        ...docData,
        tenantPrintedName: lease.tenantPrintedName,
        tenantSignedAt: lease.tenantSignedAt,
        landlordPrintedName: lease.landlordPrintedName,
        landlordSignedAt: lease.landlordSignedAt,
      })
    }
  }

  const tokens = lease.signingGroupId ? getSigningTokens(lease.signingGroupId) : []
  const tenantToken = tokens.find(t => t.party === 'tenant')?.token
  const landlordToken = tokens.find(t => t.party === 'landlord')?.token
  const tenantUrl = tenantToken ? `${APP_URL}/sign/${tenantToken}` : null
  const landlordUrl = landlordToken ? `${APP_URL}/sign/${landlordToken}` : null

  const summaryHtml = `
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <tr><td style="padding:6px 8px;color:#6b7280;width:140px">Property</td><td style="padding:6px 8px;font-weight:600">${d.propertyAddress}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Tenant</td><td style="padding:6px 8px;font-weight:600">${d.tenantName}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Landlord</td><td style="padding:6px 8px;font-weight:600">${d.landlordName}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Lease Type</td><td style="padding:6px 8px;font-weight:600">${d.leaseType}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Start Date</td><td style="padding:6px 8px;font-weight:600">${d.startDate}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Monthly Rent</td><td style="padding:6px 8px;font-weight:600">$${Number(d.monthlyRent).toLocaleString()}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Signed By</td><td style="padding:6px 8px;font-weight:600">${printedName}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Signed At</td><td style="padding:6px 8px;font-weight:600">${signedAtLabel}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Tenant Signed</td><td style="padding:6px 8px;font-weight:600">${lease.tenantSignedAt ? 'Yes' : 'Pending'}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Landlord Signed</td><td style="padding:6px 8px;font-weight:600">${lease.landlordSignedAt ? 'Yes' : 'Pending'}</td></tr>
    </table>
  `

  const signButton = (url, label) => url ? `
    <p style="margin:24px 0">
      <a href="${url}"
         style="background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
        ${label}
      </a>
    </p>` : ''

  const baseEmail = (recipientName, headline, note, extraHtml = '') => `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <div style="background:#16a34a;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:24px">
        <h2 style="margin:0;font-size:18px">${headline}</h2>
      </div>
      <p>Hi ${recipientName},</p>
      <p>${note}</p>
      ${extraHtml}
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0">
        ${summaryHtml}
      </div>
      <p style="color:#6b7280;font-size:12px">
        This confirmation serves as a record of electronic signature acceptance.<br/>
        Both parties should retain a copy of this email.
      </p>
    </div>
  `

  const executed = lease.status === 'executed'

  try {
    if (executed) {
      await sendMail({
        from:    `"${APP_NAME}" <${EMAIL_USER}>`,
        to:      d.tenantEmail,
        subject: `✓ Lease Fully Executed — ${d.propertyAddress}`,
        html:    baseEmail(
          d.tenantName,
          '✓ Lease Fully Executed',
          `All parties have signed the room rental lease for <strong>${d.propertyAddress}</strong>.`,
        ),
      })

      await sendMail({
        from:    `"${APP_NAME}" <${EMAIL_USER}>`,
        to:      d.landlordEmail,
        subject: `✓ Lease Fully Executed — ${d.propertyAddress}`,
        html:    baseEmail(
          d.landlordName,
          '✓ Lease Fully Executed',
          `All parties have signed the room rental lease for <strong>${d.propertyAddress}</strong>.`,
        ),
      })
    } else if (party === 'tenant') {
      await sendMail({
        from:    `"${APP_NAME}" <${EMAIL_USER}>`,
        to:      d.tenantEmail,
        subject: `✓ Your Signature Recorded — ${d.propertyAddress}`,
        html:    baseEmail(
          d.tenantName,
          '✓ Your Signature Recorded',
          `Your signature on the room rental lease for <strong>${d.propertyAddress}</strong> has been recorded. Waiting for the landlord to sign.`,
        ),
      })

      await sendMail({
        from:    `"${APP_NAME}" <${EMAIL_USER}>`,
        to:      d.landlordEmail,
        subject: `Action Required: Sign Your Lease — ${d.propertyAddress}`,
        html:    baseEmail(
          d.landlordName,
          'Tenant Has Signed — Your Signature Required',
          `<strong>${d.tenantName}</strong> has signed the room rental lease for <strong>${d.propertyAddress}</strong>. Please sign your copy to complete the agreement.`,
          signButton(landlordUrl, 'Review &amp; Sign as Landlord →'),
        ),
      })
    } else {
      await sendMail({
        from:    `"${APP_NAME}" <${EMAIL_USER}>`,
        to:      d.landlordEmail,
        subject: `✓ Your Signature Recorded — ${d.propertyAddress}`,
        html:    baseEmail(
          d.landlordName,
          '✓ Your Signature Recorded',
          `Your signature on the room rental lease for <strong>${d.propertyAddress}</strong> has been recorded. Waiting for the tenant to sign.`,
        ),
      })

      await sendMail({
        from:    `"${APP_NAME}" <${EMAIL_USER}>`,
        to:      d.tenantEmail,
        subject: `Action Required: Please Sign Your Lease — ${d.propertyAddress}`,
        html:    baseEmail(
          d.tenantName,
          'Landlord Has Signed — Your Signature Required',
          `<strong>${d.landlordName}</strong> has signed the room rental lease for <strong>${d.propertyAddress}</strong>. Please sign your copy to complete the agreement.`,
          signButton(tenantUrl, 'Review &amp; Sign Lease →'),
        ),
      })
    }

    if (executed && lease.documentId) {
      updateDocumentRecord(lease.documentId, { status: 'executed' }).catch(err =>
        console.error('[lease/sign] failed to sync executed status to db', err.message)
      )
    }
    res.json({ success: true, status: lease.status })
  } catch (err) {
    console.error('[/api/lease/sign]', err.message)
    res.status(500).json({ error: 'Signed but confirmation email failed.' })
  }
})

// ─────────────────────────────────────────────────────────────
// Blog / site comments (threadId = post slug or "site-feedback")
// ─────────────────────────────────────────────────────────────
app.get('/api/comments/:threadId', (req, res) => {
  const comments = getComments(req.params.threadId)
  res.json({ comments })
})

app.post('/api/comments/:threadId', (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
  const result = addComment(req.params.threadId, req.body, clientIp)
  if (result.error) return res.status(result.status).json({ error: result.error })
  res.status(201).json({ comment: result.comment })
})

// ─────────────────────────────────────────────────────────────
// State law reference data (static modules today; Postgres/API later)
// ─────────────────────────────────────────────────────────────
app.get('/api/state-laws', (req, res) => {
  res.json({ states: listStateLawCodes() })
})

app.get('/api/state-laws/:code', (req, res) => {
  const bundle = getStateLawBundle(req.params.code.toUpperCase())
  if (!bundle) return res.status(404).json({ error: 'Unknown state code' })
  res.json(bundle)
})

// ─────────────────────────────────────────────────────────────
// GET /api/my-documents — list documents for the logged-in user
// ─────────────────────────────────────────────────────────────
app.get('/api/my-documents', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  try {
    const { rows } = await pool.query(
      `SELECT document_id, title, lease_type, status, paid, created_at, updated_at
       FROM docucreate.documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.session.userId]
    )
    res.json({ documents: rows })
  } catch (err) {
    console.error('[my-documents]', err.message)
    res.status(500).json({ error: 'Could not load documents' })
  }
})

// ─────────────────────────────────────────────────────────────
// Screening affiliate click tracking (no PII)
// ─────────────────────────────────────────────────────────────
app.post('/api/events/screening-click', (req, res) => {
  try {
    recordScreeningClick(req.body || {})
    res.status(204).end()
  } catch (err) {
    console.error('[screening-click]', err.message)
    res.status(500).json({ error: 'Could not record event' })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    emailMode,
    authMethod,
    emailUser: EMAIL_USER || null,
    emailConfigured: Boolean(transporter),
    stripeEnabled,
    paymentsEnabled: isPaymentsEnabled(),
    paymentBypassed: isPaymentBypassed(),
    price: getPriceDisplay(),
    appUrl: APP_URL,
    encryptionKeySet: Boolean(process.env.DOCUMENT_ENCRYPTION_KEY),
    documentIdOnlyAccess: isDocumentIdOnlyAccess(),
    recoveryPasswordEnabled: isRecoveryPasswordEnabled(),
  })
})

// Ensure Postgres schema exists (idempotent — safe on every boot)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
async function ensureSchema() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await pool.query(sql)
    console.log('[db] schema ok')
  } catch (err) {
    console.error('[db] schema failed:', err.message)
  }
}

// Patch columns that may be missing from older installs
async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE docucreate.documents
        ADD COLUMN IF NOT EXISTS paid        BOOLEAN   NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    `)
    console.log('[db] migrations ok')
  } catch (err) {
    console.warn('[db] migration warning:', err.message)
  }
}

await ensureSchema()
await runMigrations()

const unlockedLegacy = unlockAllPendingIfBypassed()
if (unlockedLegacy > 0) {
  console.log(`[payments] marked ${unlockedLegacy} pending document(s) as paid (free unlock mode)`)
}

app.listen(PORT, () => {
  const accessMode = isDocumentIdOnlyAccess() ? 'document-id only (dev)' : 'access token required'
  console.log(`[docucreate:server] running on port ${PORT} | email: ${emailMode} | payments: ${isPaymentsEnabled() ? 'on' : 'off (free unlock)'} | access: ${accessMode}`)
  if (isDocumentIdOnlyAccess()) {
    console.warn('[config] DOCUMENT_ID_ACCESS=true — anyone with a document ID can read/edit that lease. Disable before production.')
  }
})
