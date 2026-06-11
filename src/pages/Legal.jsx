import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/brand'
import { LegalDisclaimerSections } from '../content/legalDisclaimer'

export default function Legal() {
  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto">
        <article className="card-surface p-8 sm:p-10">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-heading">Legal disclaimer</h1>
            <p className="text-muted text-sm mt-1">
              Please read before using {APP_NAME} or executing any generated lease.
            </p>
          </header>

          <LegalDisclaimerSections />

          <div className="mt-8 pt-6 border-t border-line dark:border-white/10">
            <Link
              to="/"
              className="text-sm font-medium text-accent hover:text-accent-hover dark:text-ember-300 dark:hover:text-ember-200 transition-colors"
            >
              ← Back to lease generator
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
