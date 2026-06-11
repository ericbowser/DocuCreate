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
          <span key={tag} className="blog-badge">
            {tag.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
      <h2 className="text-xl font-semibold text-heading mb-2 leading-snug">
        <Link to={`/blog/${post.slug}`} className="hover:text-accent dark:hover:text-ember-300 transition-colors">
          {post.title}
        </Link>
      </h2>
      <p className="font-blog text-lg text-muted leading-relaxed mb-3">{post.excerpt}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
        <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
      </div>
    </article>
  )
}
