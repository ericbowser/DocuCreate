import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/AppLayout'
import Home    from './pages/Home'
import Preview from './pages/Preview'
import Sign    from './pages/Sign'
import About   from './pages/About'
import Legal   from './pages/Legal'
import Blog    from './pages/Blog'
import BlogPost from './pages/BlogPost'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
