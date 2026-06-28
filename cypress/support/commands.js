/**
 * Custom Cypress commands
 */

// cy.login(email, password) — logs in via the UI login form
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('#email').type(email)
  cy.get('#password').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('eq', Cypress.config('baseUrl') + '/')
})
