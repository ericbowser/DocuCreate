import { Link } from 'react-router-dom'
import { APP_NAME, TAGLINE, COMPANY_NAME, COMPANY_EMAIL, DOMAIN, SITE_URL } from '../config/brand'
import { HiOutlineEnvelope } from '../icons'
import CommentSection from '../components/CommentSection'

export default function About() {
  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto">
        <article className="card-surface p-8 sm:p-10 space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-heading">About {APP_NAME}</h1>
            <p className="text-muted text-sm mt-1">{TAGLINE}</p>
          </header>

          <div className="space-y-4 text-body text-sm leading-relaxed">
            <p>
              {APP_NAME} is a product of <strong className="text-heading">{COMPANY_NAME}</strong>.
              We help landlords and property managers create professional, state-aware rental
              lease agreements — from room rentals to commercial spaces — with PDF export and
              electronic signature built in.
            </p>
            <p>
              Our goal is to make lease preparation fast and clear. Generated documents are
              templates with state reference data — not a substitute for advice from a licensed
              attorney in your state.
            </p>
            <p>
              <Link to="/legal" className="text-accent hover:underline dark:text-ember-300 font-medium">
                Read our full legal disclaimer
              </Link>{' '}
              to understand how state rules are used and what we do not cover.
            </p>
          </div>

          <section className="space-y-4 pt-2 border-t border-line dark:border-white/10">
            <CommentSection threadId="site-feedback" title="Site feedback" />
          </section>

          <section className="info-panel space-y-3">
            <h2 className="text-sm font-semibold text-heading">Contact</h2>
            <p className="text-sm text-body">{COMPANY_NAME}</p>
            <a
              href={`mailto:${COMPANY_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover dark:text-ember-300 dark:hover:text-ember-200 transition-colors"
            >
              <HiOutlineEnvelope className="w-4 h-4" aria-hidden="true" />
              {COMPANY_EMAIL}
            </a>
            <a href={SITE_URL} className="text-xs text-subtle hover:text-heading dark:hover:text-white transition-colors">{DOMAIN}</a>
          </section>

          <div className="pt-2">
            <Link to="/" className="text-sm font-medium text-accent hover:text-accent-hover dark:text-ember-300 dark:hover:text-ember-200 transition-colors">
              ← Create a lease
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
