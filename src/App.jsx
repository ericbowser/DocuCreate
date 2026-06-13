import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ROUTER_FUTURE } from './config/routerFuture'
import AppLayout from './components/AppLayout'
import PageLoader from './components/PageLoader'
import Home from './pages/Home'

const Preview = lazy(() => import('./pages/Preview'))
const Sign = lazy(() => import('./pages/Sign'))
const About = lazy(() => import('./pages/About'))
const Legal = lazy(() => import('./pages/Legal'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={ROUTER_FUTURE}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/"             element={<Home />} />
              <Route path="/preview/:documentId" element={<Preview />} />
              <Route path="/preview"      element={<Preview />} />
              <Route path="/sign/:token"  element={<Sign />} />
              <Route path="/about"        element={<About />} />
              <Route path="/legal"        element={<Legal />} />
              <Route path="/blog"         element={<Blog />} />
              <Route path="/blog/:slug"   element={<BlogPost />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
