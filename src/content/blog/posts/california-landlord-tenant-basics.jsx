import { Link } from 'react-router-dom'
import BlogCTA from '../BlogCTA'

export const meta = {
  slug: 'california-landlord-tenant-basics',
  title: 'California Landlord-Tenant Basics: Deposits, Notice, and Disclosures',
  excerpt:
    'An overview of common California rental rules — deposit limits, entry notice, return timelines, and frequently required disclosures.',
  publishedAt: '2026-06-01',
  updatedAt: '2026-06-01',
  author: 'Docu Create Team',
  tags: ['california', 'state-guides', 'landlords'],
  state: 'CA',
  readingMinutes: 9,
}

export function Content() {
  return (
    <>
      <p>
        California has some of the most detailed landlord-tenant statutes in the country — and many cities
        (Los Angeles, San Francisco, Oakland, and others) add rent control, just-cause eviction, and
        registration requirements on top of state law. This article summarizes <strong>state-level themes</strong>
        commonly relevant when drafting a lease; it is not a substitute for local legal review.
      </p>

      <h2>Security deposits</h2>
      <p>
        For unfurnished residential units, California generally caps security deposits at two months’ rent;
        furnished units may allow up to three months’ rent. Landlords must return deposits (with an itemized
        statement for any deductions) within <strong>21 days</strong> after the tenant vacates — one of the
        shorter deadlines nationally.
      </p>
      <p>
        AB 1482 and subsequent legislation also affect many tenancies regarding rent increases and termination
        notices for certain properties. Whether those rules apply depends on property type, age, and owner
        status — a template lease cannot determine that for you.
      </p>

      <h2>Late fees</h2>
      <p>
        Late fees must be reasonable and stated in the lease. California courts have often looked at amounts
        around $50 or a small percentage of rent as a benchmark, but “reasonable” is fact-specific. Do not
        assume a fee copied from another state will hold up here.
      </p>

      <h2>Landlord entry</h2>
      <p>
        State law typically requires <strong>24 hours’ written notice</strong> before entry for repairs,
        inspections, or showings, except in emergencies. Your lease should mirror this baseline and explain
        how notice will be delivered.
      </p>

      <h2>Disclosures landlords often need</h2>
      <ul>
        <li>Federal lead-based paint disclosure (pre-1978 housing)</li>
        <li>Move-in / move-out inspection checklist (Civil Code requirements)</li>
        <li>Bed bug disclosure for rental agreements</li>
        <li>Megan’s Law / registered sex offender database notice</li>
        <li>Flood hazard disclosure when the property is in a designated flood zone</li>
        <li>Mold, asbestos, or pest history where applicable</li>
      </ul>
      <p>
        Several of these are separate forms or addenda — not a single paragraph buried in page four of the
        lease.
      </p>

      <h2>Local ordinances matter</h2>
      <p>
        If your property is in a rent-controlled city, you may need registration numbers, relocation assistance
        clauses, and specific termination notices that state default forms do not include. Always check city
        housing department guidance in addition to state statutes.
      </p>

      <p className="text-sm text-muted">
        Reference summary only — not legal advice. Confirm current law with a California-licensed attorney.
        See our <Link to="/legal">legal disclaimer</Link>.
      </p>

      <BlogCTA />
    </>
  )
}
