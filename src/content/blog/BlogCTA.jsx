import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/brand'

export default function BlogCTA() {
  return (
    <div className="blog-cta mt-10">
      <p className="font-semibold text-heading mb-1 text-base">Ready to draft your lease?</p>
      <p className="text-muted mb-3">
        {APP_NAME} helps you build a state-informed rental agreement in minutes — with PDF export and e-signature.
      </p>
      <Link
        to="/"
        className="inline-flex text-sm font-medium text-accent hover:text-accent-hover dark:text-ember-300 dark:hover:text-ember-200 transition-colors"
      >
        Start the lease wizard →
      </Link>
    </div>
  )
}
