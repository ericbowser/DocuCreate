import Stripe from 'stripe'
import { APP_NAME } from './brand.js'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const PRICE_CENTS = parseInt(process.env.LEASE_PRICE_CENTS || '1999', 10)
const CURRENCY = process.env.STRIPE_CURRENCY || 'usd'

export const stripeEnabled = Boolean(STRIPE_SECRET)

let stripe = null
if (stripeEnabled) {
  stripe = new Stripe(STRIPE_SECRET)
}

/** Payments are opt-in: set PAYMENTS_ENABLED=true and configure Stripe keys to charge. */
export function isPaymentsEnabled() {
  if (process.env.PAYMENT_BYPASS === 'true') return false
  return process.env.PAYMENTS_ENABLED === 'true' && stripeEnabled
}

export function isPaymentBypassed() {
  return !isPaymentsEnabled()
}

export async function createCheckoutSession({ documentId, appUrl }) {
  if (!stripe) throw new Error('Stripe is not configured')

  const successUrl = `${appUrl}/preview/${documentId}?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl  = `${appUrl}/preview/${documentId}?payment=cancelled`

  const sessionParams = {
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { documentId },
    line_items: process.env.STRIPE_PRICE_ID
      ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
      : [{
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: PRICE_CENTS,
            product_data: {
              name: `${APP_NAME} Lease Agreement`,
              description: 'Unlock PDF download, print, and e-signature for your lease document',
            },
          },
        }],
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return session
}

export async function verifyCheckoutSession(sessionId, expectedDocumentId) {
  if (!stripe) return { paid: false, error: 'Stripe not configured' }
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') {
    return { paid: false, error: 'Payment not completed' }
  }
  if (session.metadata?.documentId !== expectedDocumentId) {
    return { paid: false, error: 'Session does not match document' }
  }
  return { paid: true, session }
}

export async function handleWebhook(rawBody, signature) {
  if (!stripe || !WEBHOOK_SECRET) {
    return { handled: false, error: 'Webhook not configured' }
  }
  const event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    return {
      handled: true,
      documentId: session.metadata?.documentId,
      stripeSessionId: session.id,
    }
  }
  return { handled: true }
}

export function getPriceDisplay() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY.toUpperCase(),
  }).format(PRICE_CENTS / 100)
}
