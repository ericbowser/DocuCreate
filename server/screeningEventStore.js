import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const EVENTS_FILE = path.join(DATA_DIR, 'screening-clicks.jsonl')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

const ALLOWED_STATUS = new Set(['already_screened', 'wants_screening', 'skipped'])

export function recordScreeningClick({ state, status, partner }) {
  const event = {
    timestamp: new Date().toISOString(),
    state: typeof state === 'string' && /^[A-Z]{2}$/.test(state) ? state : null,
    status: ALLOWED_STATUS.has(status) ? status : null,
    partner: typeof partner === 'string' ? partner.slice(0, 64) : null,
  }
  ensureDataDir()
  fs.appendFileSync(EVENTS_FILE, `${JSON.stringify(event)}\n`, 'utf8')
  console.log('[screening-click]', event)
  return event
}
