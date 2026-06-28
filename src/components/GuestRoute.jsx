/**
 * GuestRoute — redirects already-authenticated users away from login/register.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './PageLoader'

export default function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (user)    return <Navigate to="/" replace />
  return <Outlet />
}
