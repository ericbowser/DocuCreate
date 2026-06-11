import { Link, useParams } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import CommentSection from '../components/CommentSection'
import { LegalNotice } from '../components/LegalNotice'
import {
  getPostBySlug,
  formatPostDate,
  getStateLabel,
  BLOG_POSTS,
} from '../content/blog/registry'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="page-shell page-shell--blog">
        <div className="blog-layout card-surface p-10 sm:p-14 text-center">
          <h1 className="text-xl font-bold text-heading mb-2">Article not found</h1>
          <Link to="/blog" className="text-sm text-accent dark:text-ember-300 hover:underline">
            ← Back to blog
          </Link>
        </div>
      </div>
    )
  }

  const { Content } = post
  const related = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && (p.state === post.state || p.tags.some((t) => post.tags.includes(t))),
  ).slice(0, 3)

  return (
    <div className="page-shell page-shell--blog">
      <PageMeta title={post.title} description={post.excerpt} />
      <div className="blog-layout">
        <article className="card-surface p-10 sm:p-14">
          <header className="blog-article-header mb-10 pb-8 border-b border-line dark:border-white/10">
            <div className="flex flex-wrap gap-2 mb-3">
              {post.state && (
                <span className="blog-badge blog-badge-state">{getStateLabel(post.state)}</span>
              )}
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="blog-badge hover:opacity-80 transition-opacity"
                >
                  {tag.replace(/-/g, ' ')}
                </Link>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-heading leading-tight tracking-tight">{post.title}</h1>
            <p className="blog-excerpt mt-4">{post.excerpt}</p>
            <p className="text-muted text-sm sm:text-base mt-4">
              <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              {post.updatedAt !== post.publishedAt && (
                <> · Updated {formatPostDate(post.updatedAt)}</>
              )}
              {' · '}{post.readingMinutes} min read · {post.author}
            </p>
          </header>

          <div className="blog-prose">
            <Content />
          </div>

          <div className="mt-8 pt-6 border-t border-line dark:border-white/10">
            <LegalNotice />
          </div>
        </article>

        <div className="card-surface p-10 sm:p-14 mt-8">
          <CommentSection threadId={post.slug} title="Discussion" />
        </div>

        {related.length > 0 && (
          <aside className="card-surface p-10 sm:p-14 mt-8">
            <h2 className="text-sm font-semibold text-heading mb-4">Related articles</h2>
            <ul className="space-y-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="text-sm font-medium text-accent dark:text-ember-300 hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className="mt-6">
          <Link
            to="/blog"
            className="text-sm font-medium text-accent hover:text-accent-hover dark:text-ember-300 transition-colors"
          >
            ← All articles
          </Link>
        </div>
      </div>
    </div>
  )
}
