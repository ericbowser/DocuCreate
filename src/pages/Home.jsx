import LeaseWizard from '../components/LeaseWizard'
import ResumeLease from '../components/ResumeLease'
import { LegalNotice } from '../components/LegalNotice'

export default function Home() {
  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto">
        <p className="text-muted text-base mb-3">
          Room rentals · Apartments · Houses · Condos · Commercial — built in minutes.
        </p>
        <LegalNotice className="mb-6" />
        <ResumeLease />
        <LeaseWizard />
      </div>
    </div>
  )
}
