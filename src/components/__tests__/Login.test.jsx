import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../../pages/Login'
import { renderWithProviders } from '../../test/test-utils'

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ user: null }) })
  )
})

afterEach(() => jest.restoreAllMocks())

describe('Login page', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<Login />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    renderWithProviders(<Login />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('links to register page', () => {
    renderWithProviders(<Login />)
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register')
  })

  it('shows error message on failed login', async () => {
    global.fetch = jest.fn()
      // First call: /api/auth/me (auth hydration)
      .mockResolvedValueOnce({ json: () => Promise.resolve({ user: null }) })
      // Second call: /api/auth/login
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email or password' }),
      })

    renderWithProviders(<Login />)

    await userEvent.type(screen.getByLabelText(/email address/i), 'bad@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })

  it('disables button while submitting', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ user: null }) })
      .mockImplementationOnce(() => new Promise(() => {})) // never resolves

    renderWithProviders(<Login />)

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })
})
