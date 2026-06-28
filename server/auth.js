/**
 * Auth routes — /api/auth/*
 *
 * POST /api/auth/register   { email, password, displayName? }
 * POST /api/auth/login      { email, password }
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
import express from 'express'
import bcrypt  from 'bcryptjs'
import { pool } from './db.js'

const router = express.Router()
const SALT_ROUNDS = 12

// ── helpers ──────────────────────────────────────────────────
function safeUser(row) {
  const { password_hash, ...rest } = row
  return rest
}

// ── register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' })
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM docucreate.users WHERE email = $1',
      [email.toLowerCase()]
    )
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' })
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const { rows } = await pool.query(
      `INSERT INTO docucreate.users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email.toLowerCase(), hash, displayName ?? null]
    )

    const user = safeUser(rows[0])
    req.session.userId = user.id
    req.session.save(() => res.status(201).json({ user }))
  } catch (err) {
    console.error('[auth] register error', err)
    res.status(500).json({ error: 'Registration failed — please try again' })
  }
})

// ── login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM docucreate.users WHERE email = $1',
      [email.toLowerCase()]
    )
    const row = rows[0]
    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const match = await bcrypt.compare(password, row.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = safeUser(row)
    req.session.userId = user.id
    req.session.save(() => res.json({ user }))
  } catch (err) {
    console.error('[auth] login error', err)
    res.status(500).json({ error: 'Login failed — please try again' })
  }
})

// ── logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

// ── me ────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ user: null })
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM docucreate.users WHERE id = $1',
      [req.session.userId]
    )
    if (!rows[0]) return res.status(401).json({ user: null })
    res.json({ user: safeUser(rows[0]) })
  } catch (err) {
    console.error('[auth] me error', err)
    res.status(500).json({ error: 'Session lookup failed' })
  }
})

export default router
