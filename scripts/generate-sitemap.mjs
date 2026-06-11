/**
 * Generates public/sitemap.xml from static routes + blog post meta.
 * Run: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SITE_URL } from '../src/config/brand.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsDir = join(root, 'src/content/blog/posts')

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/legal', changefreq: 'monthly', priority: '0.5' },
]

function parsePostMeta(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const slug = source.match(/slug:\s*['"]([^'"]+)['"]/)?.[1]
  const updatedAt = source.match(/updatedAt:\s*['"]([^'"]+)['"]/)?.[1]
  const publishedAt = source.match(/publishedAt:\s*['"]([^'"]+)['"]/)?.[1]
  if (!slug) return null
  return { slug, lastmod: updatedAt || publishedAt }
}

function collectBlogRoutes() {
  return readdirSync(postsDir)
    .filter((name) => name.endsWith('.jsx'))
    .map((name) => parsePostMeta(join(postsDir, name)))
    .filter(Boolean)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(({ slug, lastmod }) => ({
      path: `/blog/${slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod,
    }))
}

function urlEntry({ path, changefreq, priority, lastmod }) {
  const loc = `${SITE_URL}${path}`
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

const routes = [...STATIC_ROUTES, ...collectBlogRoutes()]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(urlEntry).join('\n')}
</urlset>
`

const outPath = join(root, 'public/sitemap.xml')
writeFileSync(outPath, xml, 'utf8')
console.log(`Wrote ${routes.length} URLs to public/sitemap.xml`)
