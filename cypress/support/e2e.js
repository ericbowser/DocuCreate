import './commands'

// Global Cypress support file
// Add custom commands or global hooks here

// Silence known React Router future flag warnings in test output
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('React Router Future Flag Warning')) return false
})
