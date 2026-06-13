/**
 * Remove build artifacts, test output, and runtime cache.
 * Run: npm run clean
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const targets = [
  'dist',
  '.vite',
  'src/styles/output.css',
  'coverage',
  'server/data',
  'node_modules/.cache',
]

for (const rel of targets) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) {
    console.log(`skip ${rel} (not found)`)
    continue
  }
  fs.rmSync(abs, { recursive: true, force: true })
  console.log(`removed ${rel}`)
}

console.log('clean complete')
