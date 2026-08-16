import { screen, fireEvent } from '@testing-library/react'
import MyDocuments from '../../pages/MyDocuments'
import { renderWithProviders } from '../../test/test-utils'

const mockDocuments = [
  {
    document_id: 'doc-abc-123',
    title: '123 Main St — Jane Smith',
    lease_type: 'month-to-month',
    status: 'draft',
    paid: false,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    document_id: 'doc-def-456',
    title: '456 Oak Ave — John Doe',
    lease_type: 'fixed',
    status: 'executed',
    paid: true,
    created_at: '2026-02-20T14:00:00Z',
    updated_at: '2026-02-20T14:00:00Z',
  },
]

function jsonResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  })
}

function mockFetch(documents = mockDocuments) {
  global.fetch = jest.fn((url, options = {}) => {
    const path = String(url)
    const method = (options.method || 'GET').toUpperCase()
    if (path.includes('/api/auth/me')) {
      return jsonResponse({ user: { id: '1', email: 'test@example.com' } })
    }
    if (method === 'DELETE' && path.includes('/api/documents/')) {
      return jsonResponse({ deleted: true })
    }
    if (path.includes('/api/my-documents')) {
      return jsonResponse({ documents })
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
}

beforeEach(() => {
  mockFetch()
})

afterEach(() => jest.restoreAllMocks())

describe('MyDocuments page', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<MyDocuments />)
    expect(await screen.findByText('My Documents')).toBeInTheDocument()
  })

  it('renders a list of documents', async () => {
    renderWithProviders(<MyDocuments />)
    expect(await screen.findByText('123 Main St — Jane Smith')).toBeInTheDocument()
    expect(await screen.findByText('456 Oak Ave — John Doe')).toBeInTheDocument()
  })

  it('renders status badges', async () => {
    renderWithProviders(<MyDocuments />)
    expect(await screen.findByText('draft')).toBeInTheDocument()
    expect(await screen.findByText('executed')).toBeInTheDocument()
  })

  it('renders Open and Delete actions for each document', async () => {
    renderWithProviders(<MyDocuments />)
    const links = await screen.findAllByText('Open →')
    expect(links).toHaveLength(2)
    expect(links[0].closest('a')).toHaveAttribute('href', '/preview/doc-abc-123')
    expect(await screen.findAllByRole('button', { name: /delete/i })).toHaveLength(2)
  })

  it('asks for confirmation before deleting', async () => {
    renderWithProviders(<MyDocuments />)
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    expect(await screen.findByText(/delete this lease permanently/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument()
  })

  it('shows empty state when no documents', async () => {
    mockFetch([])

    renderWithProviders(<MyDocuments />)
    expect(await screen.findByText(/no documents yet/i)).toBeInTheDocument()
  })
})
