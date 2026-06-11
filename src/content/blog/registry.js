/**
 * Blog registry — add a new post in one step:
 * Create src/content/blog/posts/your-slug.jsx exporting `meta` and `Content`.
 * Listing uses meta only; article body loads on demand per slug.
 */
import { STATE_LAWS } from '../../data/stateLaws'

const metaModules = import.meta.glob('./posts/*.jsx', { eager: true, import: 'meta' })
const contentModules = import.meta.glob('./posts/*.jsx', { import: 'Content' })

export const BLOG_POSTS = Object.values(metaModules).sort(
  (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
)

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null
}

export function loadPostContent(slug) {
  const loader = contentModules[`./posts/${slug}.jsx`]
  if (!loader) return Promise.resolve(null)
  return loader().then((mod) => mod.Content ?? null)
}

export function getAllSlugs() {
  return BLOG_POSTS.map((p) => p.slug)
}

export const BLOG_TAGS = [...new Set(BLOG_POSTS.flatMap((p) => p.tags))].sort()

export function getPostsByTag(tag) {
  if (!tag) return BLOG_POSTS
  return BLOG_POSTS.filter((p) => p.tags.includes(tag))
}

export function getPostsByState(stateCode) {
  if (!stateCode) return BLOG_POSTS
  return BLOG_POSTS.filter((p) => p.state === stateCode)
}

export function getStateLabel(code) {
  return STATE_LAWS[code]?.name ?? code
}

export const BLOG_STATE_CODES = [...new Set(BLOG_POSTS.map((p) => p.state).filter(Boolean))].sort()

export function formatPostDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
