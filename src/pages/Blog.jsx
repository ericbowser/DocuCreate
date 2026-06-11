import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import BlogCard from '../components/BlogCard'
import {
  BLOG_POSTS,
  BLOG_TAGS,
  BLOG_STATE_CODES,
  getPostsByTag,
  getPostsByState,
  getStateLabel,
} from '../content/blog/registry'
import { APP_NAME } from '../config/brand'

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tagFilter = searchParams.get('tag') || ''
  const stateFilter = searchParams.get('state') || ''
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = BLOG_POSTS
    if (tagFilter) list = getPostsByTag(tagFilter)
    if (stateFilter) list = list.filter((p) => p.state === stateFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      )
    }
    return list
  }, [tagFilter, stateFilter, query])

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="page-shell page-shell--blog">
      <PageMeta
        title="Blog"
        description={`Landlord and tenant guides, lease tips, and state-specific rental law overviews from ${APP_NAME}.`}
      />
      <div className="blog-layout space-y-6">
        <header className="card-surface p-10 sm:p-14">
          <h1 className="blog-title blog-title--page">Blog</h1>
          <p className="blog-subtitle mt-4">
            Guides on leases, deposits, room rentals, and state-level landlord-tenant topics. Educational
            content only — not legal advice.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 text-sm font-medium text-accent hover:text-accent-hover dark:text-ember-300 transition-colors"
          >
            Create a lease →
          </Link>
        </header>

        <div className="card-surface p-10 sm:p-14 space-y-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="input-field w-full"
            aria-label="Search blog articles"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setFilter('tag', ''); setFilter('state', '') }}
              className={`blog-filter-chip ${!tagFilter && !stateFilter ? 'blog-filter-chip-active' : ''}`}
            >
              All
            </button>
            {BLOG_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilter('tag', tagFilter === tag ? '' : tag)}
                className={`blog-filter-chip ${tagFilter === tag ? 'blog-filter-chip-active' : ''}`}
              >
                {tag.replace(/-/g, ' ')}
              </button>
            ))}
          </div>

          {BLOG_STATE_CODES.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-subtle self-center mr-1">States:</span>
              {BLOG_STATE_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFilter('state', stateFilter === code ? '' : code)}
                  className={`blog-filter-chip ${stateFilter === code ? 'blog-filter-chip-active' : ''}`}
                >
                  {getStateLabel(code)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted card-surface p-6">No articles match your filters.</p>
          ) : (
            filtered.map((post) => <BlogCard key={post.slug} post={post} />)
          )}
        </div>
      </div>
    </div>
  )
}
