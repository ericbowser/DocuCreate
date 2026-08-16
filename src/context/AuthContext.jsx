import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)

  // Hydrate session on mount
  useEffect(() => {
    apiFetch('/api/auth/me', { credentials: 'include' })
      .then(r => parseJsonResponse(r))
      .then(({ user }) => setUser(user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await parseJsonResponse(res)
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, password, displayName) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, displayName }),
    })
    const data = await parseJsonResponse(res)
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
