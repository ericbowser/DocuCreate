import { Link } from 'react-router-dom'
import { APP_NAME, COMPANY_NAME, COMPANY_EMAIL } from '../config/brand'
import { STATE_LAWS_LAST_REVIEWED } from '../data/stateLaws'

export { STATE_LAWS_LAST_REVIEWED }

export function LegalDisclaimerSections() {
  return (
    <div className="legal-prose space-y-8 text-sm text-body leading-relaxed">
      <section className="warn-panel">
        <h2 className="text-base font-bold text-heading mb-2">Important notice</h2>
        <p>
          {APP_NAME} is operated by {COMPANY_NAME}. We are <strong className="text-heading">not a law firm</strong> and
          do <strong className="text-heading">not provide legal advice</strong>. Nothing on this site or in any document
          generated here creates an attorney-client relationship. You should have a licensed attorney in your state
          review any lease before you sign it or ask a tenant to sign it.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-heading mb-2">What {APP_NAME} does</h2>
        <p className="mb-3">
          {APP_NAME} is a self-service document generator. Based on your answers, it assembles a rental lease agreement
          from template language, your custom terms, and state-specific reference information. You may preview the
          document, download a PDF, and optionally send it for electronic signature.
        </p>
        <p>
          Output is intended as a <strong className="text-heading">starting point</strong> for landlords and property
          managers — not a guarantee that your lease complies with every law that applies to your property or tenancy.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-heading mb-2">How state information is used</h2>
        <p className="mb-3">
          When you select a U.S. state (or Washington, D.C.), {APP_NAME} loads reference data from our internal
          state law summary file. That data is used in the following ways:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-body">
          <li>
            <strong className="text-heading">Wizard guidance</strong> — During the wizard, you see summary notes for
            security deposits, late fees, landlord entry notice, and deposit return timelines for the selected state.
          </li>
          <li>
            <strong className="text-heading">Deposit calculator hint</strong> — Where we have a statutory deposit
            multiplier on file, the wizard may show a suggested maximum deposit based on monthly rent. This is a
            convenience only; your actual limit may differ (e.g., furnished vs. unfurnished units).
          </li>
          <li>
            <strong className="text-heading">Lease document text</strong> — The generated lease includes your selected
            state in governing-law clauses, standard terms (such as deposit return deadlines and notice-to-enter
            language), and a checklist of commonly required or recommended disclosures for that state.
          </li>
          <li>
            <strong className="text-heading">Disclosure reminders</strong> — Items such as lead-paint or move-in
            checklist requirements are listed as reminders in the document. {APP_NAME} does <em>not</em> generate
            separate statutory disclosure forms, HUD pamphlets, or city-specific addenda.
          </li>
        </ul>
        <p className="mt-3 text-muted text-xs">
          State reference data last reviewed: {STATE_LAWS_LAST_REVIEWED}. Laws change frequently.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-heading mb-2">Limitations you should know</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Our summaries cover <strong className="text-heading">state-level rules only</strong>. They do not include
            city, county, or municipal ordinances (rent control, just-cause eviction, registration programs, occupancy
            limits, etc.). A note in our data may mention a major city (e.g., Chicago) but does not replace local legal
            review.
          </li>
          <li>
            Reference data is <strong className="text-heading">not exhaustive</strong>. It highlights common deposit,
            fee, notice, and disclosure topics — not every statute, regulation, or court rule that may apply.
          </li>
          <li>
            Labels like &ldquo;required&rdquo; or &ldquo;recommended&rdquo; in our disclosure lists are general
            guidance. Whether a disclosure applies depends on your building age, location, tenancy type, and current law.
          </li>
          <li>
            {APP_NAME} does not verify facts you enter (property condition, habitability, subsidized housing status,
            HOA rules, commercial zoning, etc.).
          </li>
          <li>
            Standard lease clauses are generic templates. They may need to be added to, removed, or rewritten for your
            situation.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-heading mb-2">Your responsibilities</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Confirm all names, dates, amounts, and property descriptions are accurate.</li>
          <li>Determine which federal, state, and local laws apply to your rental (Fair Housing Act, ADA, VAWA, lead paint, etc.).</li>
          <li>Provide all legally required disclosures and attachments in the form your jurisdiction requires.</li>
          <li>Ensure rent, fees, deposits, and termination terms comply with current law and any rent-control rules.</li>
          <li>Keep signed copies and follow proper notice and service procedures for your state.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-heading mb-2">Electronic signatures</h2>
        <p>
          {APP_NAME} may offer tools to collect a tenant signature electronically. Whether an e-signature is valid for
          your lease depends on applicable federal and state law (including the ESIGN Act and state UETA variants),
          the parties involved, and how the document is delivered and retained. We do not warrant that our e-signature
          flow satisfies every legal requirement in every jurisdiction.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-heading mb-2">No warranty</h2>
        <p>
          {APP_NAME} and all generated documents are provided <strong className="text-heading">&ldquo;as is&rdquo;</strong> without
          warranties of any kind, express or implied, including fitness for a particular purpose or non-infringement.
          {COMPANY_NAME} is not liable for damages arising from use of this service or reliance on generated documents,
          to the fullest extent permitted by law.
        </p>
      </section>

      <section className="info-panel">
        <h2 className="text-base font-semibold text-heading mb-2">Questions</h2>
        <p>
          For product support, contact{' '}
          <a href={`mailto:${COMPANY_EMAIL}`} className="text-accent hover:underline dark:text-ember-300">
            {COMPANY_EMAIL}
          </a>.
          For legal questions about your lease, consult a licensed attorney in your state.
        </p>
      </section>
    </div>
  )
}

/** Compact notice for wizard and home — links to full legal page */
export function LegalNotice({ className = '' }) {
  return (
    <p className={`text-xs text-muted leading-relaxed ${className}`}>
      {APP_NAME} is not a law firm and does not provide legal advice. State rules shown are general reference
      summaries only — not a compliance guarantee.{' '}
      <Link to="/legal" className="text-accent hover:underline dark:text-ember-300 font-medium">
        Read full legal disclaimer
      </Link>
    </p>
  )
}
