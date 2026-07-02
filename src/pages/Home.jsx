import LeaseWizard from '../components/LeaseWizard'
import { LegalNotice } from '../components/LegalNotice'

export default function Home() {
  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto">
        <p className="text-muted text-base mb-3">
          Room rentals · Apartments · Houses · Condos · Commercial — built in minutes.
          Already collected first month&apos;s rent? Check that option on the financials step.
        </p>
        <LegalNotice className="mb-6" />
        <LeaseWizard />
      </div>
    </div>
  )
}
