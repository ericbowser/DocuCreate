import { Link } from 'react-router-dom'
import { APP_NAME } from '../../../config/brand'
import BlogCTA from '../BlogCTA'

export const meta = {
  slug: 'security-deposit-guide',
  title: "Security Deposits: What Landlords Should Know",
  excerpt:
    'How deposit caps, itemized deductions, return deadlines, and move-in documentation work — and why they differ by state.',
  publishedAt: '2026-05-22',
  updatedAt: '2026-06-01',
  author: 'Docu Create Team',
  tags: ['deposits', 'guides', 'landlords'],
  state: null,
  readingMinutes: 8,
}

export function Content() {
  return (
    <>
      <p>
        Security deposits are one of the most litigated areas of landlord-tenant law. Tenants expect their
        money back; landlords need protection against unpaid rent and property damage. The rules governing
        both sides are almost entirely state-specific — sometimes city-specific.
      </p>

      <h2>Is there a statutory deposit cap?</h2>
      <p>
        Some states cap deposits at one or two months’ rent (or a multiplier for furnished units). Others
        impose no limit but require deposits to be held in a separate trust account. A few cities layer
        additional rules on top — rent-controlled jurisdictions may treat deposits differently than the
        state default.
      </p>
      <p>
        When you use {APP_NAME}, we surface deposit reference notes for
        your selected state. Always verify current statutes before collecting money.
      </p>

      <h2>Move-in condition documentation</h2>
      <p>
        Many states require or strongly encourage a move-in inspection checklist signed by both parties.
        Photos and dated checklists are your best defense against “it was already like that” disputes at
        move-out. Complete this <em>before</em> the tenant takes possession when possible.
      </p>

      <h2>What can you deduct?</h2>
      <p>
        Typical allowable deductions include unpaid rent, damage beyond normal wear and tear, and
        cleaning required to restore the unit to the same condition as move-in (minus ordinary wear).
        Normal wear — faded paint, minor carpet wear from walking — generally cannot be charged to the tenant.
      </p>

      <h2>Return deadlines and itemization</h2>
      <p>
        States set strict timelines for returning deposits and sending an itemized statement of deductions
        (commonly 14–45 days after move-out). Missing the deadline can forfeit your right to withhold
        anything — even for legitimate damage — in some jurisdictions.
      </p>

      <h2>Interest and separate accounts</h2>
      <p>
        A handful of states require landlords to pay interest on deposits or keep them in interest-bearing
        accounts. Massachusetts, for example, has detailed deposit handling rules beyond a simple cap.
      </p>

      <h2>Practical tips</h2>
      <ul>
        <li>Put deposit terms in the lease: amount, purpose, return process, and forwarding address obligations.</li>
        <li>Never commingle deposits with personal funds if your state requires segregation.</li>
        <li>Send return letters via trackable mail when deducting, keeping copies of photos and invoices.</li>
        <li>Review <Link to="/blog">state-specific articles</Link> for deeper dives where we publish them.</li>
      </ul>

      <p className="text-sm text-muted">
        Not legal advice. Laws change — confirm requirements with a licensed attorney in your state.
      </p>

      <BlogCTA />
    </>
  )
}