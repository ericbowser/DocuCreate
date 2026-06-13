const buckets = new Map()
const unlockBuckets = new Map()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60
const UNLOCK_WINDOW_MS = 15 * 60_000
const UNLOCK_MAX = 10

function clientKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown'
}

/** Lightweight in-memory rate limit for document API routes. */
export function documentRateLimit(req, res, next) {
  const key = clientKey(req)
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 }
    buckets.set(key, bucket)
  }

  bucket.count += 1
  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
  }

  next()
}

/** Stricter limit for password unlock attempts. */
export function unlockRateLimit(req, res, next) {
  const key = clientKey(req)
  const now = Date.now()
  let bucket = unlockBuckets.get(key)

  if (!bucket || now - bucket.start > UNLOCK_WINDOW_MS) {
    bucket = { start: now, count: 0 }
    unlockBuckets.set(key, bucket)
  }

  bucket.count += 1
  if (bucket.count > UNLOCK_MAX) {
    return res.status(429).json({ error: 'Too many unlock attempts. Try again later.' })
  }

  next()
}
