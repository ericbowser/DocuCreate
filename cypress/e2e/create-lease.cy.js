/**
 * End-to-end: Create a Room Rental Lease
 *
 * Flow:
 *   1. Register or login (handles existing account gracefully)
 *   2. Step through the entire LeaseWizard
 *   3. Arrive at the Preview page with the full lease rendered
 *   4. Confirm the lease appears in My Documents
 *
 * Prerequisites: npm run dev must be running (or use npm run cy:e2e)
 *
 * Run headless:    npm run cy:lease
 * Run interactive: npm run cy:open
 * Run with server: npm run cy:e2e
 */

const TEST_EMAIL    = 'demo@execute-engrave.com'
const TEST_PASSWORD = 'DemoPass123!'

// Keystroke delay — makes typing look human for demo recordings
const TYPE_DELAY = 80

// Register the demo user — silently skip if already exists
function ensureRegistered() {
  cy.request({
    method: 'POST',
    url:    'http://localhost:24334/api/auth/register',
    body:   { email: TEST_EMAIL, password: TEST_PASSWORD, displayName: 'Demo User' },
    failOnStatusCode: false,   // 409 (already exists) is fine
  }).then((res) => {
    expect([201, 409]).to.include(res.status)
  })
}

describe('Create a Room Rental Lease', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    // Verify the API is up — gives a clear error if the server isn't running
    cy.request({ url: 'http://localhost:24334/api/health', failOnStatusCode: false })
      .its('status').should('eq', 200)
  })

  it('registers (if needed), logs in, completes the wizard, and previews the lease', () => {

    // ── Register ───────────────────────────────────────────────
    ensureRegistered()

    // Clear the session cookie set by registration so GuestRoute shows the login form
    cy.clearCookies()

    // ── Login ──────────────────────────────────────────────────
    cy.visit('/login')
    cy.wait(600)
    cy.get('#email').type(TEST_EMAIL, { delay: TYPE_DELAY })
    cy.wait(300)
    cy.get('#password').type(TEST_PASSWORD, { delay: TYPE_DELAY })
    cy.wait(400)
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/$/)
    cy.wait(600)

    // ── Step 1: Document type ──────────────────────────────────
    cy.contains('What type of lease').should('be.visible')
    cy.wait(500)
    cy.contains('Room Rental').click()
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 2: State ──────────────────────────────────────────
    cy.contains('Where is the property located').should('be.visible')
    cy.wait(500)
    cy.get('select').first().select('TX')
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 3: Landlord ───────────────────────────────────────
    cy.contains('Tell us about the landlord').should('be.visible')
    cy.wait(400)
    cy.get('[name="landlordName"]').type('Eric Bowser', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="landlordStreet"]').type('100 Commerce St', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="landlordCity"]').type('Dallas', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="landlordState"]').select('TX')
    cy.wait(200)
    cy.get('[name="landlordZip"]').type('75201', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="landlordPhone"]').type('2145550100', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="landlordEmail"]').type(TEST_EMAIL, { delay: TYPE_DELAY })
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 4: Tenant ─────────────────────────────────────────
    cy.contains('Tell us about the tenant').should('be.visible')
    cy.wait(400)
    cy.get('[name="tenantName"]').type('Jane Smith', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="tenantPhone"]').type('2145550199', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="tenantEmail"]').type('jane.smith@example.com', { delay: TYPE_DELAY })
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 5: Property ───────────────────────────────────────
    cy.contains('Where is the rental located').should('be.visible')
    cy.wait(400)
    cy.get('[name="propertyStreet"]').type('200 Elm Street', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="propertyCity"]').type('Dallas', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="propertyState"]').select('TX')
    cy.wait(200)
    cy.get('[name="propertyZip"]').type('75202', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="propertyDescription"]').type('Upstairs bedroom with private bath and closet', { delay: TYPE_DELAY })
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 6: Dates ──────────────────────────────────────────
    // Use invoke('val') + trigger('change') — native date inputs crash with .type()
    cy.contains('When does the lease start').should('be.visible')
    cy.wait(500)
    cy.get('[name="startDate"]')
      .invoke('val', '2026-08-01')
      .trigger('input')
      .trigger('change')
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 7: Financials ─────────────────────────────────────
    cy.contains('financial terms').should('be.visible')
    cy.wait(400)
    cy.get('[name="monthlyRent"]').clear().type('850', { delay: TYPE_DELAY })
    cy.wait(200)
    cy.get('[name="securityDeposit"]').clear().type('850', { delay: TYPE_DELAY })
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 8: Utilities ──────────────────────────────────────
    cy.contains('utilities').should('be.visible')
    cy.wait(400)
    cy.contains('label', 'Water').click()
    cy.wait(200)
    cy.contains('label', 'Trash').click()
    cy.wait(400)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 9: Pets ───────────────────────────────────────────
    cy.contains('pet policy').should('be.visible')
    cy.wait(600)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 10: Rules ─────────────────────────────────────────
    cy.contains('additional terms').should('be.visible')
    cy.wait(600)
    cy.contains('button', 'Continue').click()
    cy.wait(500)

    // ── Step 11: Review & Submit ───────────────────────────────
    cy.contains('Review your lease').should('be.visible')
    cy.contains('Jane Smith').should('be.visible')
    cy.contains('200 Elm Street').should('be.visible')
    cy.wait(800)
    cy.contains('button', /generate|create|save/i).click()

    // ── Preview page ───────────────────────────────────────────
    cy.url().should('include', '/preview/', { timeout: 15000 })
    cy.wait(800)
    cy.contains('Lease Preview').should('be.visible')
    cy.contains('Jane Smith').should('be.visible')
    cy.contains('200 Elm Street').should('be.visible')
    cy.contains('Download PDF').should('be.visible')
    cy.contains('Send for E-Signature').should('be.visible')

    // ── My Documents ───────────────────────────────────────────
    cy.wait(600)
    cy.contains('My Docs').click()
    cy.url().should('include', '/my-documents')
    cy.contains('200 Elm Street').should('be.visible')
  })
})
