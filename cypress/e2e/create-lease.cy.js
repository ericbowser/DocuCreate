/**
 * End-to-end: Create a Room Rental Lease
 *
 * Flow:
 *   1. Register (or login if already registered)
 *   2. Step through the entire LeaseWizard
 *   3. Arrive at the Preview page with the full lease rendered
 *
 * Run:  npx cypress run --spec cypress/e2e/create-lease.cy.js
 * Open: npx cypress open
 */

const TEST_EMAIL    = 'demo@execute-engrave.com'
const TEST_PASSWORD = 'DemoPass123!'

describe('Create a Room Rental Lease', () => {
  before(() => {
    // Register once; ignore 409 if the account already exists
    cy.request({
      method:   'POST',
      url:      'http://localhost:24334/api/auth/register',
      body:     { email: TEST_EMAIL, password: TEST_PASSWORD, displayName: 'Demo User' },
      failOnStatusCode: false,
    })
  })

  it('walks through the full lease wizard and reaches the preview', () => {
    // ── Login ──────────────────────────────────────────────────
    cy.visit('/login')
    cy.get('#email').type(TEST_EMAIL)
    cy.get('#password').type(TEST_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/')

    // ── Step 1: Document type ──────────────────────────────────
    cy.contains('What type of lease').should('be.visible')
    cy.contains('Room Rental').click()
    cy.contains('button', 'Next').click()

    // ── Step 2: State ──────────────────────────────────────────
    cy.contains('Where is the property located').should('be.visible')
    cy.get('select, [role="combobox"]').first().select('TX')
    cy.contains('button', 'Next').click()

    // ── Step 3: Landlord ───────────────────────────────────────
    cy.contains('Tell us about the landlord').should('be.visible')
    cy.get('[name="landlordName"]').type('Eric Bowser')
    cy.get('[name="landlordStreet"]').type('100 Commerce St')
    cy.get('[name="landlordCity"]').type('Dallas')
    cy.get('[name="landlordState"]').select('TX')
    cy.get('[name="landlordZip"]').type('75201')
    cy.get('[name="landlordPhone"]').type('2145550100')
    cy.get('[name="landlordEmail"]').type(TEST_EMAIL)
    cy.contains('button', 'Next').click()

    // ── Step 4: Tenant ─────────────────────────────────────────
    cy.contains('Tell us about the tenant').should('be.visible')
    cy.get('[name="tenantName"]').type('Jane Smith')
    cy.get('[name="tenantPhone"]').type('2145550199')
    cy.get('[name="tenantEmail"]').type('jane.smith@example.com')
    cy.contains('button', 'Next').click()

    // ── Step 5: Property ───────────────────────────────────────
    cy.contains('Where is the rental located').should('be.visible')
    cy.get('[name="propertyStreet"]').type('200 Elm Street')
    cy.get('[name="propertyCity"]').type('Dallas')
    cy.get('[name="propertyState"]').select('TX')
    cy.get('[name="propertyZip"]').type('75202')
    cy.get('[name="propertyDescription"]').type('Upstairs bedroom with private bath and closet')
    cy.contains('button', 'Next').click()

    // ── Step 6: Dates ──────────────────────────────────────────
    cy.contains('When does the lease start').should('be.visible')
    cy.get('[name="startDate"]').type('2026-08-01')
    cy.contains('button', 'Next').click()

    // ── Step 7: Financials ─────────────────────────────────────
    cy.contains('financial terms').should('be.visible')
    cy.get('[name="monthlyRent"]').clear().type('850')
    cy.get('[name="securityDeposit"]').clear().type('850')
    cy.contains('button', 'Next').click()

    // ── Step 8: Utilities ──────────────────────────────────────
    cy.contains('utilities').should('be.visible')
    cy.contains('label', 'Water').click()
    cy.contains('label', 'Trash').click()
    cy.contains('button', 'Next').click()

    // ── Step 9: Pets ───────────────────────────────────────────
    cy.contains('pet policy').should('be.visible')
    cy.contains('button', 'Next').click()

    // ── Step 10: Rules ─────────────────────────────────────────
    cy.contains('additional terms').should('be.visible')
    cy.contains('button', 'Next').click()

    // ── Step 11: Review ────────────────────────────────────────
    cy.contains('Review your lease').should('be.visible')
    cy.contains('Jane Smith').should('be.visible')
    cy.contains('200 Elm Street').should('be.visible')
    cy.contains('button', /generate|create|save/i).click()

    // ── Preview ────────────────────────────────────────────────
    cy.url().should('include', '/preview/')
    cy.contains('Lease Preview').should('be.visible')
    cy.contains('Jane Smith').should('be.visible')
    cy.contains('200 Elm Street').should('be.visible')

    // Full document is visible (payments disabled)
    cy.contains('Download PDF').should('be.visible')
    cy.contains('Send for E-Signature').should('be.visible')

    // My Docs in navbar shows the new lease
    cy.contains('My Docs').click()
    cy.url().should('include', '/my-documents')
    cy.contains('200 Elm Street').should('be.visible')
  })
})
