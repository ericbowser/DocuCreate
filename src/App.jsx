import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ROUTER_FUTURE } from './config/routerFuture'
import AppLayout from './components/AppLayout'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import Home from './pages/Home'

const Preview    = lazy(() => import('./pages/Preview'))
const Sign       = lazy(() => import('./pages/Sign'))
const About      = lazy(() => import('./pages/About'))
const Legal      = lazy(() => import('./pages/Legal'))
const Blog       = lazy(() => import('./pages/Blog'))
const BlogPost   = lazy(() => import('./pages/BlogPost'))
const Login      = lazy(() => import('./pages/Login'))
const Register   = lazy(() => import('./pages/Register'))
const MyDocuments = lazy(() => import('./pages/MyDocuments'))

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtools,
      })),
    )
  : () => null

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 2,  // 2 min before refetch
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={ROUTER_FUTURE}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppLayout />}>

                  {/* Guest-only: redirect logged-in users to / */}
                  <Route element={<GuestRoute />}>
                    <Route path="/login"    element={<Login />} />
                    <Route path="/register" element={<Register />} />
                  </Route>

                  {/* Protected: redirect logged-out users to /login */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/"                    element={<Home />} />
                    <Route path="/my-documents"        element={<MyDocuments />} />
                    <Route path="/preview/:documentId" element={<Preview />} />
                    <Route path="/preview"             element={<Preview />} />
                    <Route path="/sign/:token"         element={<Sign />} />
                  </Route>

                  {/* Public pages */}
                  <Route path="/about"      element={<About />} />
                  <Route path="/legal"      element={<Legal />} />
                  <Route path="/blog"       element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />

                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}

export default App
