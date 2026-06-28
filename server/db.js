import './loadEnv.js'
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options:  '-c search_path=docucreate,public',
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error', err)
})
