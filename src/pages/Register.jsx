import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageMeta from '../components/PageMeta'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [error,       setError]       = useState('')
  const [busy,        setBusy]        = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      return setError('Passwords do not match')
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters')
    }

    setBusy(true)
    try {
      await register(email, password, displayName || undefined)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageMeta title="Create Account — Docu Create" />

      <div className="page-shell flex items-start justify-center pt-12 sm:pt-20">
        <div className="w-full max-w-md">

          <div className="bg-surface dark:bg-surface-elevated border border-line dark:border-line-dark rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-heading mb-1">Create your account</h1>
            <p className="text-muted text-sm mb-7">Start creating legal documents in minutes</p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-ember-50 dark:bg-ember-950/40 border border-ember-200 dark:border-ember-800 text-ember-700 dark:text-ember-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-heading mb-1.5">
                  Name <span className="text-ink-subtle font-normal">(optional)</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-line-dark bg-white dark:bg-surface-input px-3.5 py-2.5 text-sm text-heading placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-heading mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-line-dark bg-white dark:bg-surface-input px-3.5 py-2.5 text-sm text-heading placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-heading mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-line-dark bg-white dark:bg-surface-input px-3.5 py-2.5 text-sm text-heading placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-heading mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-line-dark bg-white dark:bg-surface-input px-3.5 py-2.5 text-sm text-heading placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition-colors"
              >
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
