import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { ROUTER_FUTURE } from '../config/routerFuture'

export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter future={ROUTER_FUTURE} initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
  )
}

export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter future={ROUTER_FUTURE} initialEntries={[route]}>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>,
  )
}
