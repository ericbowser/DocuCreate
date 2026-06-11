import { Link } from 'react-router-dom'
import { APP_NAME, COMPANY_NAME, DOMAIN, SITE_URL } from '../config/brand'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="max-w-6xl mx-auto px-4 py-2.5 text-xs text-subtle flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span>
          <span className="font-medium text-heading">{COMPANY_NAME}</span>
          {' · '}{APP_NAME} ·{' '}
          <a href={SITE_URL} className="hover:text-heading dark:hover:text-white transition-colors">{DOMAIN}</a>
        </span>
        <span className="sm:text-right">
          <Link to="/blog" className="hover:text-heading dark:hover:text-white transition-colors">Blog</Link>
          {' · '}
          <Link to="/about" className="hover:text-heading dark:hover:text-white transition-colors">About</Link>
          {' · '}
          <Link to="/legal" className="hover:text-heading dark:hover:text-white transition-colors">Legal</Link>
          {' · '}© {year}
        </span>
      </div>
    </footer>
  )
}
