import { Link } from 'react-router-dom'
import { APP_NAME } from '../../../config/brand'
import BlogCTA from '../BlogCTA'

export const meta = {
  slug: 'room-rental-lease-guide',
  title: 'Room Rental Leases: How They Differ from Whole-Unit Leases',
  excerpt:
    'Shared housing needs clearer rules for common areas, guests, utilities, and house rules — here is what to spell out in a room lease.',
  publishedAt: '2026-06-08',
  updatedAt: '2026-06-08',
  author: 'Docu Create Team',
  tags: ['room-rental', 'guides', 'landlords'],
  state: null,
  readingMinutes: 6,
}

export function Content() {
  return (
    <>
      <p>
        Renting a room in an owner-occupied home or a shared house is still a tenancy in most states. A handshake
        deal about “just pay rent and don’t cause trouble” leaves gray areas around kitchen use, overnight guests,
        parking, and who pays which utilities.
      </p>

      <h2>Define the rented space vs. shared space</h2>
      <p>
        The lease should list the bedroom (or private area) and enumerate shared spaces: kitchen, bathrooms,
        living room, laundry, storage, and yard. Include whether the tenant has exclusive use of a bathroom or
        shares one with others.
      </p>

      <h2>House rules and quiet hours</h2>
      <p>
        Shared living arrangements benefit from explicit rules: cleaning schedules, food storage, smoking,
        parties, and quiet hours. Attach house rules as an addendum both parties sign so updates are documented.
      </p>

      <h2>Utilities and internet</h2>
      <p>
        State whether rent is all-inclusive or whether the tenant pays a fixed share of utilities, or a percentage
        based on occupancy. Ambiguous “split utilities” clauses cause recurring conflict.
      </p>

      <h2>Guests and occupancy limits</h2>
      <p>
        Limit overnight guests if needed for insurance or local occupancy rules. Identify who is an authorized
        occupant vs. a guest — subletting or Airbnb-style rentals in a room rental often violate master leases
        and local law.
      </p>

      <h2>Access and privacy</h2>
      <p>
        Owner-occupiers sometimes assume they can enter the tenant’s room without notice. In most states, the
        tenant’s private room still requires proper notice except in emergencies. Put entry rules in writing.
      </p>

      <h2>Same legal backbone as any lease</h2>
      <p>
        Room rentals still need rent amount, deposit terms, term length, maintenance responsibilities, and
        state-appropriate disclosures. {APP_NAME} includes a room-rental document type in the wizard for
        exactly this scenario.
      </p>

      <p className="text-sm text-muted">
        Not legal advice. <Link to="/legal">Read our disclaimer</Link>.
      </p>

      <BlogCTA />
    </>
  )
}
