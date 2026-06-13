import { useCallback, useEffect, useState } from 'react'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'
import { HiOutlineChatBubbleLeftRight } from '../icons'

const POLL_MS = 15_000

function formatWhen(iso) {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function CommentSection({ threadId, title = 'Comments' }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')

  const fetchComments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await apiFetch(`/api/comments/${encodeURIComponent(threadId)}`)
      if (!res.ok) throw new Error('Could not load comments')
      const data = await parseJsonResponse(res)
      setComments(data.comments || [])
      setError('')
    } catch {
      if (!silent) setError('Comments could not be loaded. Is the API server running?')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    fetchComments()
    const id = setInterval(() => fetchComments(true), POLL_MS)
    return () => clearInterval(id)
  }, [fetchComments])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch(`/api/comments/${encodeURIComponent(threadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, body }),
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Could not post comment')
      setBody('')
      setComments((prev) => [data.comment, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comment-section" aria-labelledby={`comments-${threadId}`}>
      <h2 id={`comments-${threadId}`} className="flex items-center gap-2 text-lg font-semibold text-heading mb-4">
        <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-accent dark:text-ember-300" aria-hidden="true" />
        {title}
        <span className="text-xs font-normal text-subtle">({comments.length})</span>
      </h2>

      <form onSubmit={handleSubmit} className="comment-form space-y-3 mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted mb-1 block">Name</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              required
              placeholder="Your name"
              className="input-field w-full"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-muted mb-1 block">Comment</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
            rows={3}
            placeholder="Share feedback or questions (public)"
            className="input-field w-full resize-y min-h-[88px]"
          />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-sm px-4 py-2 disabled:opacity-60"
        >
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
        <p className="text-xs text-subtle">
          Comments refresh automatically. Be respectful — no legal advice or personal information about tenants.
        </p>
      </form>

      {loading && comments.length === 0 ? (
        <p className="text-sm text-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted">No comments yet. Be the first to share feedback.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <span className="font-medium text-heading text-base">{c.authorName}</span>
                <time className="text-xs text-subtle" dateTime={c.createdAt}>
                  {formatWhen(c.createdAt)}
                </time>
              </div>
              <p className="text-sm text-body whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
