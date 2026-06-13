import { screen } from '@testing-library/react'
import BlogCTA from '../BlogCTA'
import { APP_NAME } from '../../../config/brand'
import { renderWithRouter } from '../../../test/test-utils'

describe('BlogCTA', () => {
  it('renders CTA copy and wizard link', () => {
    renderWithRouter(<BlogCTA />)
    expect(screen.getByText('Ready to draft your lease?')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(APP_NAME))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start the lease wizard/i })).toHaveAttribute('href', '/')
  })
})
