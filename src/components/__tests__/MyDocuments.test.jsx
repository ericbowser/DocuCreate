import { screen } from '@testing-library/react'
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

function mockFetch(documents = mockDocuments) {
  global.fetch = jest.fn((url) => {
    const path = String(url)
    if (path.includes('/api/auth/me')) {
      return Promise.resolve({
        json: () => Promise.resolve({ user: { id: '1', email: 'test@example.com' } }),
      })
    }
    if (path.includes('/api/my-documents')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ documents }),
      })
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

  it('renders Open links for each document', async () => {
    renderWithProviders(<MyDocuments />)
    const links = await screen.findAllByText('Open →')
    expect(links).toHaveLength(2)
    expect(links[0].closest('a')).toHaveAttribute('href', '/preview/doc-abc-123')
  })

  it('shows empty state when no documents', async () => {
    mockFetch([])

    renderWithProviders(<MyDocuments />)
    expect(await screen.findByText(/no documents yet/i)).toBeInTheDocument()
  })
})
