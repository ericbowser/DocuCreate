import { Link } from 'react-router-dom'
import BlogCTA from '../BlogCTA'

export const meta = {
  slug: 'essential-lease-clauses',
  title: 'Essential Clauses Every Residential Lease Should Include',
  excerpt:
    'A practical checklist of core lease terms — parties, rent, deposits, maintenance, and termination — before you customize for your state.',
  publishedAt: '2026-05-15',
  updatedAt: '2026-06-01',
  author: 'Docu Create Team',
  tags: ['leases', 'guides', 'landlords'],
  state: null,
  readingMinutes: 7,
}

export function Content() {
  return (
    <>
      <p>
        Whether you rent a single room or an entire house, a written lease is your primary record of what
        landlord and tenant agreed to. Missing or vague clauses cause most disputes later — not because
        someone acted in bad faith, but because expectations were never spelled out.
      </p>
      <p>
        This guide covers <strong>standard building blocks</strong>. Laws vary by state and city; treat this
        as a planning checklist, not legal advice. See our{' '}
        <Link to="/legal">legal disclaimer</Link> and consult a local attorney before signing.
      </p>

      <h2>1. Identify the parties and the property</h2>
      <p>
        List legal names (or business entity names) for landlord and tenant, plus a complete property address.
        For room rentals, describe the private space <em>and</em> shared areas (kitchen, bathroom, laundry).
        Ambiguity here makes enforcement harder.
      </p>

      <h2>2. Term and renewal</h2>
      <p>
        State the start date, end date (for fixed terms), or whether the lease is month-to-month. Include how
        renewal or holdover works: does it auto-convert to month-to-month? What notice is required to end the
        tenancy?
      </p>

      <h2>3. Rent, due date, and payment method</h2>
      <p>
        Specify monthly rent, due date, acceptable payment methods, and where to pay. If late fees apply, state
        the amount or formula and any grace period — many states require fees to be disclosed in the lease itself.
      </p>

      <h2>4. Security deposit</h2>
      <p>
        Document the deposit amount, what it may be used for, and how and when it will be returned. Reference
        your state’s return timeline in the lease text so both sides know the clock starts at move-out.
      </p>

      <h2>5. Maintenance and repairs</h2>
      <p>
        Clarify who handles routine upkeep vs. damage caused by the tenant. Note how tenants should report
        maintenance issues and expected response times where reasonable.
      </p>

      <h2>6. Entry and privacy</h2>
      <p>
        Landlords generally need notice before entering except in emergencies. Your state may specify minimum
        notice (24 hours, 48 hours, etc.) — align your lease language with that baseline.
      </p>

      <h2>7. Rules, guests, and use of premises</h2>
      <p>
        Cover occupancy limits, guest policies, smoking, pets, parking, and prohibited activities. Specific
        rules are easier to enforce than generic “tenant must behave” language.
      </p>

      <h2>8. Disclosures and addenda</h2>
      <p>
        Federal lead-based paint disclosures apply to pre-1978 housing nationwide. States and cities often require
        additional forms (bed bugs, flood zone, radon, move-in checklists). Attach required disclosures as
        separate signed addenda — do not rely on a single paragraph in the body of the lease.
      </p>

      <h2>9. Default and remedies</h2>
      <p>
        Describe what happens if rent is unpaid or other material terms are breached, consistent with your
        state’s eviction and notice requirements. Generic “landlord may terminate immediately” language is
        often unenforceable without proper statutory notices.
      </p>

      <h2>10. Governing law and signatures</h2>
      <p>
        Name the state whose laws govern the agreement. Leave space for dated signatures (or e-signatures) from
        all adult tenants and the landlord.
      </p>

      <BlogCTA />
    </>
  )
}
