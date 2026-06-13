import { render, screen } from '@testing-library/react'
import PageLoader from '../PageLoader'

describe('PageLoader', () => {
  it('renders accessible loading status', () => {
    render(<PageLoader />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('Loading…')
  })
})
