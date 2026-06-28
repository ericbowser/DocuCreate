import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '../ThemeToggle'
import { renderWithProviders } from '../../test/test-utils'

describe('ThemeToggle', () => {
  it('starts in dark mode by default', () => {
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument()
  })

  it('toggles to light mode on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /light mode/i }))
    expect(screen.getByRole('button', { name: /ember night mode/i })).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('restores stored theme preference', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument()
  })
})
