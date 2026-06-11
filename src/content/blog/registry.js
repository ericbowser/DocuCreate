/**
 * Blog registry — add a new post in two steps:
 * 1. Create src/content/blog/posts/your-slug.jsx exporting `meta` and `Content`
 * 2. Import it below and add to POST_MODULES
 */
import * as essentialLeaseClauses from './posts/essential-lease-clauses.jsx'
import * as securityDepositGuide from './posts/security-deposit-guide.jsx'
import * as californiaBasics from './posts/california-landlord-tenant-basics.jsx'
import * as texasGuide from './posts/texas-lease-agreements-guide.jsx'
import * as roomRentalGuide from './posts/room-rental-lease-guide.jsx'
import { STATE_LAWS } from '../../data/stateLaws'

const POST_MODULES = [
  essentialLeaseClauses,
  securityDepositGuide,
  californiaBasics,
  texasGuide,
  roomRentalGuide,
]

export const BLOG_POSTS = POST_MODULES.map((mod) => ({
  ...mod.meta,
  Content: mod.Content,
})).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null
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
