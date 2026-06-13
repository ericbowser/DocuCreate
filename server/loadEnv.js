/**
 * Load environment before any other server module reads process.env.
 * Canonical location: project root `.env`. Legacy fallback: `src/.env`.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, 'src', '.env') })
