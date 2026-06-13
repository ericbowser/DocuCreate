import './loadEnv.js'
import express   from 'express'
import cors      from 'cors'
import crypto    from 'crypto'
import { createEmailTransporter, getEmailConfig } from './emailTransport.js'
import { storeLease, getLease, signLease, deleteLeasesByDocumentId } from './leaseStore.js'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentMeta,
  getDecryptedLease,
  buildMaskedPreview,
  markDocumentPaid,
  isDocumentPaid,
} from './documentStore.js'
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

app.use(cors())

// Stripe webhook must receive raw body — register before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']
    const result = await handleWebhook(req.body, sig)
    if (result.documentId) {
      markDocumentPaid(result.documentId, { stripeSessionId: result.stripeSessionId })
      console.log(`[stripe] Document ${result.documentId} marked paid`)
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[/api/stripe/webhook]', err.message)
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json({ limit: '5mb' }))

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

// ─────────────────────────────────────────────────────────────
// POST /api/documents/create
// Store encrypted lease server-side; client only gets document ID
// ─────────────────────────────────────────────────────────────
app.post('/api/documents/create', (req, res) => {
  const { leaseData } = req.body
  if (!leaseData?.tenantName || !leaseData?.landlordName) {
    return res.status(400).json({ error: 'Incomplete lease data' })
  }
  const documentId = createDocument(leaseData)
  res.json({
    documentId,
    paymentRequired: !isPaymentBypassed(),
    price: getPriceDisplay(),
  })
})

// ─────────────────────────────────────────────────────────────
// GET /api/documents/:id/edit
// Full lease data for wizard pre-fill (document ID is the access token)
// ─────────────────────────────────────────────────────────────
app.get('/api/documents/:id/edit', (req, res) => {
  const meta = getDocumentMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Document not found' })

  const leaseData = getDecryptedLease(req.params.id)
  if (!leaseData) return res.status(500).json({ error: 'Document could not be read' })

  res.json({ documentId: req.params.id, leaseData })
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/documents/:id — update stored lease after wizard edit
// ─────────────────────────────────────────────────────────────
app.patch('/api/documents/:id', (req, res) => {
  const { leaseData } = req.body
  if (!leaseData?.tenantName || !leaseData?.landlordName) {
    return res.status(400).json({ error: 'Incomplete lease data' })
  }
  if (!updateDocument(req.params.id, leaseData)) {
    return res.status(404).json({ error: 'Document not found' })
  }
  res.json({ documentId: req.params.id })
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/documents/:id — remove stored lease (document ID is the access token)
// ─────────────────────────────────────────────────────────────
app.delete('/api/documents/:id', (req, res) => {
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
app.get('/api/documents/:id', (req, res) => {
  const meta = getDocumentMeta(req.params.id)
  if (!meta) return res.status(404).json({ error: 'Document not found' })

  const paid = isDocumentPaid(req.params.id) || isPaymentBypassed()
  const leaseData = getDecryptedLease(req.params.id)
  if (!leaseData) return res.status(500).json({ error: 'Document could not be read' })

  res.json({
    ...meta,
    paid,
    paymentBypassed: isPaymentBypassed(),
    price: getPriceDisplay(),
    leaseData: paid ? leaseData : buildMaskedPreview(leaseData),
  })
})

// ─────────────────────────────────────────────────────────────
// POST /api/documents/:id/verify-payment
// Called after Stripe redirect with session_id
// ─────────────────────────────────────────────────────────────
app.post('/api/documents/:id/verify-payment', async (req, res) => {
  const { sessionId } = req.body
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

  if (isPaymentBypassed()) {
    markDocumentPaid(req.params.id, {})
    return res.json({ paid: true, bypassed: true })
  }

  const result = await verifyCheckoutSession(sessionId, req.params.id)
  if (!result.paid) return res.status(402).json({ error: result.error })

  markDocumentPaid(req.params.id, { stripeSessionId: sessionId })
  const leaseData = getDecryptedLease(req.params.id)
  res.json({ paid: true, leaseData })
})

// ─────────────────────────────────────────────────────────────
// POST /api/stripe/create-checkout-session
// ─────────────────────────────────────────────────────────────
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const { documentId } = req.body
  if (!documentId) return res.status(400).json({ error: 'documentId required' })

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

// ─────────────────────────────────────────────────────────────
// POST /api/lease/send
// ─────────────────────────────────────────────────────────────
app.post('/api/lease/send', async (req, res) => {
  const { leaseData, documentId } = req.body

  let data = leaseData
  if (documentId) {
    if (!isDocumentPaid(documentId) && !isPaymentBypassed()) {
      return res.status(402).json({ error: 'Payment required before sending for signature' })
    }
    data = getDecryptedLease(documentId)
  }

  if (!data?.tenantEmail) {
    return res.status(400).json({ error: 'Missing leaseData or tenantEmail' })
  }

  const token      = crypto.randomUUID()
  const signingUrl = `${APP_URL}/sign/${token}`
  storeLease(token, data, { documentId: documentId ?? null })

  try {
    await sendMail({
      from:    `"${APP_NAME}" <${EMAIL_USER}>`,
      to:      data.tenantEmail,
      subject: `Action Required: Please Sign Your Room Rental Lease`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
          <h2 style="color:#2563eb;margin-bottom:4px">Room Rental Lease — Signature Required</h2>
          <p>Hi ${data.tenantName || 'there'},</p>
          <p>
            <strong>${data.landlordName}</strong> has prepared a room rental lease agreement
            for the property at <strong>${data.propertyAddress}</strong>.
          </p>
          <p>Please click the button below to review and sign the lease electronically.</p>
          <p style="margin:32px 0">
            <a href="${signingUrl}"
               style="background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Review &amp; Sign Lease →
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px">
            If you did not expect this email, you can safely ignore it.<br/>
            This link is unique to you — do not share it.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:11px">
            Generated by ${APP_NAME}. This document is for informational purposes only.
            Consult a licensed attorney before execution.
          </p>
        </div>
      `,
    })
    res.json({ success: true, token })
  } catch (err) {
    console.error('[/api/lease/send]', err.message)
    res.status(500).json({ error: 'Failed to send email.' })
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

  const d         = lease.leaseData
  const signedAt  = new Date(lease.tenantSignedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })

  const summaryHtml = `
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <tr><td style="padding:6px 8px;color:#6b7280;width:140px">Property</td><td style="padding:6px 8px;font-weight:600">${d.propertyAddress}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Tenant</td><td style="padding:6px 8px;font-weight:600">${d.tenantName}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Landlord</td><td style="padding:6px 8px;font-weight:600">${d.landlordName}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Lease Type</td><td style="padding:6px 8px;font-weight:600">${d.leaseType}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Start Date</td><td style="padding:6px 8px;font-weight:600">${d.startDate}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Monthly Rent</td><td style="padding:6px 8px;font-weight:600">$${Number(d.monthlyRent).toLocaleString()}</td></tr>
      <tr><td style="padding:6px 8px;color:#6b7280">Signed By</td><td style="padding:6px 8px;font-weight:600">${printedName}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:6px 8px;color:#6b7280">Signed At</td><td style="padding:6px 8px;font-weight:600">${signedAt}</td></tr>
    </table>
  `

  const baseEmail = (recipientName, note) => `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <div style="background:#16a34a;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:24px">
        <h2 style="margin:0;font-size:18px">✓ Lease Signed Successfully</h2>
      </div>
      <p>Hi ${recipientName},</p>
      <p>${note}</p>
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0">
        ${summaryHtml}
      </div>
      <p style="color:#6b7280;font-size:12px">
        This confirmation serves as a record of electronic signature acceptance.<br/>
        Both parties should retain a copy of this email.
      </p>
    </div>
  `

  try {
    await sendMail({
      from:    `"${APP_NAME}" <${EMAIL_USER}>`,
      to:      d.tenantEmail,
      subject: `✓ Lease Signed — ${d.propertyAddress}`,
      html:    baseEmail(d.tenantName, `You have successfully signed the room rental lease for <strong>${d.propertyAddress}</strong>.`),
    })

    await sendMail({
      from:    `"${APP_NAME}" <${EMAIL_USER}>`,
      to:      d.landlordEmail,
      subject: `✓ Tenant Signed — ${d.propertyAddress}`,
      html:    baseEmail(d.landlordName, `<strong>${d.tenantName}</strong> has signed the room rental lease for <strong>${d.propertyAddress}</strong>.`),
    })

    res.json({ success: true })
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
  })
})

app.listen(PORT, () => {
  console.log(`[docucreate:server] running on port ${PORT} | email: ${emailMode} | payments: ${isPaymentsEnabled() ? 'on' : 'off (free unlock)'}`)
})
