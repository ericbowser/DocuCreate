import { useState } from 'react'
import { buildLeaseContent } from '../utils/leaseContent'
import { fmt } from '../utils/leaseCalcs'
import { HiCheck } from '../icons'
import { APP_NAME } from '../config/brand'

function DocRow({ label, value }) {
  if (!value) return null
  return (
    <div className="doc-row">
      <dt className="doc-label">{label}</dt>
      <dd className="doc-value">{value}</dd>
    </div>
  )
}

function DocSection({ id, title, children }) {
  return (
    <section id={id} className="doc-section scroll-mt-28">
      <h2 className="doc-section-title">{title}</h2>
      {children}
    </section>
  )
}

export default function LeaseAgreementView({ data, locked = false }) {
  const c = buildLeaseContent(data)
  const [activeSection, setActiveSection] = useState('parties')
  const money = (n) => (locked ? '••••' : `$${fmt(n)}`)

  const scrollTo = (id) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="lease-viewer">
      {/* Section navigation */}
      <nav className="lease-nav no-print" aria-label="Document sections">
        <p className="lease-nav-label">Jump to</p>
        <div className="lease-nav-pills">
          {c.sections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`lease-nav-pill ${activeSection === id ? 'lease-nav-pill-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Document paper */}
      <div className={`lease-document-wrap ${locked ? 'lease-document-locked' : ''}`}>
      <article
        className="lease-document"
        aria-label="Lease agreement"
        onCopy={locked ? (e) => e.preventDefault() : undefined}
        onContextMenu={locked ? (e) => e.preventDefault() : undefined}
      >
        {locked && (
          <div className="doc-watermark" aria-hidden="true">
            <span>PREVIEW — PAY TO UNLOCK</span>
            <span>PREVIEW — PAY TO UNLOCK</span>
            <span>PREVIEW — PAY TO UNLOCK</span>
          </div>
        )}
        {/* Page 1 header */}
        <header className="doc-header">
          <h1 className="doc-title">{c.leaseTitle}</h1>
          <p className="doc-subtitle">
            This agreement is legally binding upon the signatures of both parties below.
          </p>
          {c.docTypeLabel && <p className="doc-badge">{c.docTypeLabel}</p>}
          {c.stateName && <p className="doc-state">State of {c.stateName}</p>}
        </header>

        <DocSection id="parties" title="Parties">
          <dl className="doc-dl">
            <DocRow label="Landlord" value={c.landlordName} />
            <DocRow label="Landlord Address" value={c.landlordAddress} />
            <DocRow label="Landlord Contact" value={`${c.landlordPhone}  |  ${c.landlordEmail}`} />
            <DocRow label="Business Name" value={c.businessName} />
            <DocRow label={c.tenantLabel} value={c.tenantName} />
            <DocRow label="Tenant Contact" value={`${c.tenantPhone}  |  ${c.tenantEmail}`} />
          </dl>
        </DocSection>

        <DocSection id="property" title="Rental Property">
          <dl className="doc-dl">
            <DocRow label="Property Address" value={c.propertyAddress} />
            <DocRow label={c.propLabel} value={c.propDesc} />
            {!c.isCommercial && c.furnished && <DocRow label="Furnishing" value={c.furnished} />}
            <DocRow label="Shared Areas" value={c.sharedAreas} />
            <DocRow label="Permitted Use" value={c.permittedUse} />
            <DocRow label="Square Footage" value={c.squareFootage} />
          </dl>
        </DocSection>

        <DocSection id="terms" title="Lease Terms">
          <dl className="doc-dl">
            <DocRow label="Lease Type" value={c.leaseType ?? 'Fixed Term'} />
            <DocRow label="Lease Period" value={c.leasePeriodText} />
            <DocRow label="Landlord Notice to Vacate" value={`${c.landlordNoticeDays} days written notice`} />
            <DocRow label="Tenant Notice to Vacate" value={`${c.tenantNoticeDays} days written notice`} />
            <DocRow label="Monthly Rent" value={`${money(c.monthlyRent)} per month`} />
            <DocRow label="Rent Due" value={`Day ${c.rentDueDay} of each month`} />
            <DocRow label="Late Fee" value={`${money(c.lateFee)} if not received by the 5th of the month`} />
          </dl>
        </DocSection>

        <DocSection id="deposit" title="Security Deposit">
          <dl className="doc-dl">
            <DocRow label="Deposit Amount" value={`${money(c.securityDeposit)} (due prior to move-in)`} />
            <DocRow label="Return Deadline" value={`Within ${c.returnDays} days of move-out per ${c.state} law`} />
          </dl>
          <p className="doc-paragraph">{c.depositParagraph}</p>
        </DocSection>

        <DocSection id="move-in" title="Move-In Cost Summary">
          <table className="doc-table">
            <tbody>
              {locked && c.moveIn.total === 0 ? (
                <tr>
                  <td>Rent, deposits &amp; fees</td>
                  <td>••••</td>
                </tr>
              ) : c.moveIn.lines.map((line, i) => (
                <tr key={i} className={i % 2 !== 0 ? 'doc-table-alt' : ''}>
                  <td>{line.label}{line.paid ? ' (received)' : ''}</td>
                  <td>{money(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Due at Signing</td>
                <td>{locked && c.moveIn.total === 0 ? '••••' : money(c.moveIn.totalDue ?? c.moveIn.total)}</td>
              </tr>
            </tfoot>
          </table>
          {!locked && c.firstMonthReceivedParagraph && (
            <p className="doc-paragraph doc-paragraph-sm">{c.firstMonthReceivedParagraph}</p>
          )}
          {!locked && c.moveIn.proration && (
            <p className="doc-paragraph doc-paragraph-sm">
              Pro-ration: {c.moveIn.proration.label} = ${fmt(c.moveIn.proration.dailyRate)}/day × {c.moveIn.proration.days} days.
            </p>
          )}
        </DocSection>

        <DocSection id="utilities" title={c.isCommercial ? 'Utilities' : 'Utilities & Pets'}>
          <dl className="doc-dl">
            <DocRow label="Utilities Included" value={c.utilitiesText} />
            {!c.isCommercial && c.petPolicy && <DocRow label="Pet Policy" value={c.petPolicy} />}
            {!c.isCommercial && c.petDeposit && <DocRow label="Pet Deposit" value={money(c.petDeposit)} />}
          </dl>
        </DocSection>

        {c.houseRules && (
          <DocSection id="rules" title={c.isCommercial ? 'Operating Rules & Additional Terms' : 'House Rules & Additional Terms'}>
            <p className="doc-paragraph">{c.houseRules}</p>
          </DocSection>
        )}

        {data.stateData?.disclosures?.length > 0 && (
          <DocSection id="disclosures" title={`${c.stateName} — Required Disclosures`}>
            <ul className="doc-disclosure-list">
              {data.stateData.disclosures.map((d, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <HiCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </DocSection>
        )}

        <footer className="doc-page-footer">
          Page 1 of 2 — Generated by {APP_NAME} on {c.today}. See below for Standard Terms and Signatures.
        </footer>

        <div className="doc-page-break" aria-hidden="true">
          <span>Page 2</span>
        </div>

        {/* Page 2 */}
        <header className="doc-header doc-header-secondary">
          <h1 className="doc-title doc-title-sm">Standard Terms and Conditions</h1>
          <p className="doc-subtitle">Incorporated by reference into the {c.leaseTitle} above.</p>
        </header>

        <DocSection id="standard" title="Standard Terms">
          <div className="doc-clauses">
            {c.clauses.map(({ num, title, text }) => (
              <div key={num} className="doc-clause">
                <h3 className="doc-clause-title">{num}. {title.toUpperCase()}</h3>
                <p className="doc-clause-text">{text}</p>
              </div>
            ))}
          </div>
        </DocSection>

        <DocSection id="signatures" title="Signatures">
          <p className="doc-paragraph">
            By signing below, both parties acknowledge they have read, understood, and agreed to all terms set forth in
            this {c.leaseTitle} including all Standard Terms above.
          </p>
          <div className="doc-sig-grid">
            <div className="doc-sig-block">
              <div className="doc-sig-line" />
              <p className="doc-sig-label">Landlord Signature</p>
              <p className="doc-sig-name">{c.landlordName}</p>
              <div className="doc-date-line" />
              <p className="doc-sig-label">Date</p>
            </div>
            <div className="doc-sig-block">
              <div className="doc-sig-line" />
              <p className="doc-sig-label">{c.tenantLabel} Signature</p>
              <p className="doc-sig-name">
                {c.businessName ? `${c.businessName} — ${c.tenantName}` : c.tenantName}
              </p>
              <div className="doc-date-line" />
              <p className="doc-sig-label">Date</p>
            </div>
          </div>

          {(c.landlordPrintedName && c.landlordSignedAt) || (c.tenantPrintedName && c.tenantSignedAt) ? (
            <div className="doc-esig">
              <p className="doc-esig-title">Electronic Signature Record</p>
              {c.landlordPrintedName && c.landlordSignedAt && (
                <>
                  <p>Landlord signed as: {c.landlordPrintedName}</p>
                  <p>Date &amp; Time: {new Date(c.landlordSignedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </>
              )}
              {c.tenantPrintedName && c.tenantSignedAt && (
                <>
                  <p>Tenant signed as: {c.tenantPrintedName}</p>
                  <p>Date &amp; Time: {new Date(c.tenantSignedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </>
              )}
              <p className="doc-esig-note">These electronic signatures are legally binding under applicable e-signature law.</p>
            </div>
          ) : null}
        </DocSection>

        <footer className="doc-page-footer">
          Page 2 of 2 — Generated by {APP_NAME} on {c.today}.
          For informational purposes only. Consult a licensed attorney before execution.
        </footer>
      </article>
      {locked && <div className="doc-lock-overlay" aria-hidden="true" />}
      </div>
    </div>
  )
}
