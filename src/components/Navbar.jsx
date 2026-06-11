import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { APP_NAME, TAGLINE } from '../config/brand'

export default function Navbar() {
  return (
    <header className="app-navbar">
      <div className="max-w-6xl mx-auto px-4 min-h-[4.25rem] py-2 flex items-center justify-between gap-4">
        <Link to="/" className="group min-w-0">
          <span className="block text-2xl font-bold text-heading tracking-tight group-hover:text-accent dark:group-hover:text-ember-300 transition-colors">
            {APP_NAME}
          </span>
          <span className="block text-base text-muted truncate sm:sr-only">
            {TAGLINE}
          </span>
        </Link>
        <p className="hidden sm:block text-base text-subtle flex-1 text-center truncate px-4">
          {TAGLINE}
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <Link
            to="/blog"
            className="text-base font-medium text-muted hover:text-heading dark:hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            to="/about"
            className="text-base font-medium text-muted hover:text-heading dark:hover:text-white transition-colors"
          >
            About
          </Link>
          <Link
            to="/legal"
            className="text-base font-medium text-muted hover:text-heading dark:hover:text-white transition-colors"
          >
            Legal
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
