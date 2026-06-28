import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { ROUTER_FUTURE } from '../config/routerFuture'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter future={ROUTER_FUTURE} initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
  )
}

export function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={ROUTER_FUTURE} initialEntries={[route]}>
        <ThemeProvider>
          <AuthProvider>
            {ui}
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
