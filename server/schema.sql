-- ============================================================
-- DocuCreate — PostgreSQL schema
-- Run once against your target database:
--   psql -U <user> -d <db> -f server/schema.sql
-- ============================================================

CREATE SCHEMA IF NOT EXISTS docucreate;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS docucreate.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  display_name  TEXT,
  role          TEXT        NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON docucreate.users (email);

-- ── Sessions ─────────────────────────────────────────────────
-- Server-side sessions stored in DB (no JWT needed).
-- Express session middleware writes here via connect-pg-simple.
CREATE TABLE IF NOT EXISTS docucreate.sessions (
  sid     TEXT        PRIMARY KEY,
  sess    JSONB       NOT NULL,
  expire  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expire_idx ON docucreate.sessions (expire);

-- ── Password reset tokens ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS docucreate.password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES docucreate.users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User Documents ───────────────────────────────────────────
-- Tracks every document a user creates, linking the file-based
-- document_id (used by the existing store) to the owning user.
CREATE TABLE IF NOT EXISTS docucreate.documents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES docucreate.users(id) ON DELETE CASCADE,
  document_id   TEXT        NOT NULL UNIQUE,  -- matches file-based ID
  title         TEXT,                          -- e.g. "123 Main St — Jane Smith"
  lease_type    TEXT,                          -- month-to-month | fixed
  status        TEXT        NOT NULL DEFAULT 'draft',  -- draft | sent | executed
  paid          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON docucreate.documents (user_id);

DROP TRIGGER IF EXISTS documents_updated_at ON docucreate.documents;

-- ── Trigger: auto-update updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION docucreate.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON docucreate.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON docucreate.users
  FOR EACH ROW EXECUTE FUNCTION docucreate.set_updated_at();
