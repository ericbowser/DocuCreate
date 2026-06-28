import { screen } from '@testing-library/react'
import Footer from '../Footer'
import { COMPANY_NAME } from '../../config/brand'
import { renderWithRouter } from '../../test/test-utils'

describe('Footer', () => {
  it('renders company name', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText(COMPANY_NAME)).toBeInTheDocument()
  })

  it('shows current year', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute('href', '/legal')
  })
})
