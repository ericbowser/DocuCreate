import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageMeta from '../components/PageMeta'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const from = location.state?.from?.pathname || '/'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageMeta title="Sign In — Docu Create" />

      <div className="page-shell flex items-start justify-center pt-12 sm:pt-20">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-surface dark:bg-surface-elevated border border-line dark:border-line-dark rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-heading mb-1">Welcome back</h1>
            <p className="text-muted text-sm mb-7">Sign in to your Docu Create account</p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-ember-50 dark:bg-ember-950/40 border border-ember-200 dark:border-ember-800 text-ember-700 dark:text-ember-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-heading">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-line-dark bg-white dark:bg-surface-input px-3.5 py-2.5 text-sm text-heading placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition-colors"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-accent hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
