import { screen } from '@testing-library/react'
import Navbar from '../Navbar'
import { APP_NAME, TAGLINE } from '../../config/brand'
import { renderWithProviders } from '../../test/test-utils'

describe('Navbar', () => {
  it('renders brand name and tagline', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByRole('link', { name: new RegExp(APP_NAME) })).toHaveAttribute('href', '/')
    expect(screen.getAllByText(TAGLINE).length).toBeGreaterThan(0)
  })

  it('renders navigation links', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute('href', '/legal')
  })

  it('includes theme toggle', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByRole('button', { name: /switch to/i })).toBeInTheDocument()
  })
})
