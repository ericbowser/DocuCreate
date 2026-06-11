import nodemailer from 'nodemailer'

export function getEmailConfig(env = process.env) {
  const EMAIL_USER         = (env.EMAIL_USER          || '').trim()
  const EMAIL_RECEIVE      = (env.EMAIL_RECEIVE        || EMAIL_USER).trim()
  const EMAIL_APP_PASSWORD = (env.EMAIL_APP_PASSWORD   || '').replace(/\s+/g, '')
  const GOOGLE_CLIENT_ID      = (env.GOOGLE_CLIENT_ID      || '').trim()
  const GOOGLE_CLIENT_SECRET  = (env.GOOGLE_CLIENT_SECRET  || '').trim()
  const GOOGLE_REFRESH_TOKEN  = (env.GOOGLE_REFRESH_TOKEN  || '').trim()

  const oauthConfigured       = Boolean(EMAIL_USER && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN)
  const appPasswordConfigured = Boolean(EMAIL_USER && EMAIL_APP_PASSWORD)

  return {
    EMAIL_USER, EMAIL_RECEIVE, EMAIL_APP_PASSWORD,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
    oauthConfigured, appPasswordConfigured,
    configured: oauthConfigured || appPasswordConfigured,
  }
}

export function createEmailTransporter(config) {
  if (config.oauthConfigured) {
    return {
      method: 'oauth2',
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: {
          type: 'OAuth2',
          user: config.EMAIL_USER,
          clientId: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          refreshToken: config.GOOGLE_REFRESH_TOKEN,
        },
      }),
    }
  }
  if (config.appPasswordConfigured) {
    return {
      method: 'app-password',
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user: config.EMAIL_USER, pass: config.EMAIL_APP_PASSWORD },
      }),
    }
  }
  return { method: 'none', transporter: null }
}
