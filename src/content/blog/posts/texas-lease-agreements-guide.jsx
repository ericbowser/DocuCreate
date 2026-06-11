import { Link } from 'react-router-dom'
import BlogCTA from '../BlogCTA'

export const meta = {
  slug: 'texas-lease-agreements-guide',
  title: 'Texas Rental Lease Agreements: Key Terms and State Rules',
  excerpt:
    'Texas has no statutory security deposit cap, but late fees, deposit return timing, and required disclosures still matter when you draft a lease.',
  publishedAt: '2026-06-05',
  updatedAt: '2026-06-05',
  author: 'Docu Create Team',
  tags: ['texas', 'state-guides', 'landlords'],
  state: 'TX',
  readingMinutes: 8,
}

export function Content() {
  return (
    <>
      <p>
        Texas is often described as landlord-friendly, but that does not mean leases can ignore statutory
        requirements. Property Code provisions still govern security deposits, late fees, landlord identity
        disclosures, and the eviction process. This overview highlights topics Texas landlords frequently
        address in written leases.
      </p>

      <h2>Security deposits</h2>
      <p>
        Texas imposes <strong>no statewide cap</strong> on security deposit amounts. Landlords must still
        return the deposit within <strong>30 days</strong> after the tenant surrenders the premises, along
        with a written description and itemized list of deductions if any portion is withheld.
      </p>
      <p>
        Failing to provide the itemized accounting on time can expose landlords to liability for the full
        deposit amount plus penalties in some cases.
      </p>

      <h2>Late fees</h2>
      <p>
        For properties with four or more units, late fees after a grace period are commonly capped at
        <strong> 12% of rent</strong>; for smaller properties, <strong>10%</strong> is the typical statutory
        reference point. The fee must be disclosed in the lease, and the grace period (often two days for
        certain notices) should be documented.
      </p>

      <h2>Landlord name and address</h2>
      <p>
        Texas requires the landlord’s name and address for notices to be provided to the tenant in writing.
        Many landlords include this in the lease header or a dedicated “Notices” section so service of legal
        notices is unambiguous.
      </p>

      <h2>Entry and repairs</h2>
      <p>
        Texas does not use the same rigid 24-hour notice statute as California, but leases should still define
        “reasonable notice” for non-emergency entry and describe how tenants request repairs. The warranty of
        habitability and repair remedies under Texas law apply regardless of what the lease says.
      </p>

      <h2>Eviction and lockouts</h2>
      <p>
        Self-help evictions (changing locks, shutting off utilities to force move-out) are prohibited. Termination
        and possession generally require following the forcible entry and detainer process. Your lease default
        clause should reference compliance with Texas Property Code notice requirements, not improvised timelines.
      </p>

      <h2>Disclosures</h2>
      <ul>
        <li>Federal lead-based paint disclosure for pre-1978 dwellings</li>
        <li>Flooding disclosure when the property is in a 100-year floodplain (for many leases)</li>
        <li>Owner or management company contact information</li>
      </ul>

      <p className="text-sm text-muted">
        Educational summary only — not legal advice. Consult a Texas attorney for your specific property and
        tenancy. <Link to="/legal">Legal disclaimer</Link>.
      </p>

      <BlogCTA />
    </>
  )
}
