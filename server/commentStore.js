import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')

const MAX_BODY = 2000
const MAX_NAME = 80
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5

const rateBuckets = new Map()

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify({}, null, 2))
  }
}

function loadAll() {
  ensureData()
  try {
    return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveAll(data) {
  ensureData()
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2))
}

function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

function checkRateLimit(ip) {
  const now = Date.now()
  const bucket = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (bucket.length >= RATE_MAX) return false
  bucket.push(now)
  rateBuckets.set(ip, bucket)
  return true
}

export function getComments(threadId) {
  const data = loadAll()
  const list = data[threadId] || []
  return list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ id, authorName, body, createdAt }) => ({ id, authorName, body, createdAt }))
}

export function addComment(threadId, { authorName, body }, clientIp = 'unknown') {
  const name = sanitizeText(authorName, MAX_NAME)
  const text = sanitizeText(body, MAX_BODY)

  if (!threadId || typeof threadId !== 'string' || threadId.length > 120) {
    return { error: 'Invalid thread', status: 400 }
  }
  if (!name || name.length < 2) {
    return { error: 'Please enter your name (at least 2 characters).', status: 400 }
  }
  if (!text || text.length < 3) {
    return { error: 'Please enter a comment (at least 3 characters).', status: 400 }
  }
  if (!checkRateLimit(clientIp)) {
    return { error: 'Too many comments. Please wait a minute and try again.', status: 429 }
  }

  const data = loadAll()
  const comment = {
    id: crypto.randomUUID(),
    authorName: name,
    body: text,
    createdAt: new Date().toISOString(),
  }

  if (!data[threadId]) data[threadId] = []
  data[threadId].push(comment)
  saveAll(data)

  return { comment: { id: comment.id, authorName: comment.authorName, body: comment.body, createdAt: comment.createdAt } }
}
