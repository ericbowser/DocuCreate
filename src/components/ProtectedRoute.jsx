/**
 * ProtectedRoute — redirects to /login when the user is not authenticated.
 * Shows nothing (PageLoader) while the session is still hydrating.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './PageLoader'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
