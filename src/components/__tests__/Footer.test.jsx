import { render, screen } from '@testing-library/react'
import Footer from '../Footer'
import { APP_NAME, COMPANY_NAME, DOMAIN } from '../../config/brand'
import { renderWithRouter } from '../../test/test-utils'

describe('Footer', () => {
  it('renders company and app name', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText(COMPANY_NAME)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(APP_NAME))).toBeInTheDocument()
  })

  it('links to domain and nav pages', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByRole('link', { name: DOMAIN })).toHaveAttribute('href', `https://${DOMAIN}`)
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute('href', '/legal')
  })

  it('shows current year', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
  })
})
