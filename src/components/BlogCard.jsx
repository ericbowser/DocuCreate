import { Link } from 'react-router-dom'
import { formatPostDate, getStateLabel } from '../content/blog/registry'

export default function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {post.state && (
          <span className="blog-badge blog-badge-state">{getStateLabel(post.state)}</span>
        )}
        {post.tags.slice(0, 2).map((tag) => (
          <Link
            key={tag}
            to={`/blog?tag=${encodeURIComponent(tag)}`}
            className="blog-badge hover:opacity-80 transition-opacity"
          >
            {tag.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>
      <h2 className="blog-title blog-title--card">
        <Link to={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      <p className="blog-subtitle mb-3">{post.excerpt}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
        <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
      </div>
    </article>
  )
}
