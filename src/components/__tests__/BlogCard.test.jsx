import { screen } from '@testing-library/react'
import BlogCard from '../BlogCard'
import { renderWithRouter } from '../../test/test-utils'

jest.mock('../../content/blog/registry', () => ({
  formatPostDate: () => 'June 1, 2026',
  getStateLabel: (code) => (code === 'CA' ? 'California' : code),
}))

const mockPost = {
  slug: 'test-post',
  title: 'Test Lease Article',
  excerpt: 'A short excerpt for testing.',
  publishedAt: '2026-06-01',
  readingMinutes: 5,
  state: 'CA',
  tags: ['guides', 'landlords'],
}

describe('BlogCard', () => {
  it('renders post title, excerpt, and metadata', () => {
    renderWithRouter(<BlogCard post={mockPost} />)
    expect(screen.getByRole('heading', { name: mockPost.title })).toBeInTheDocument()
    expect(screen.getByText(mockPost.excerpt)).toBeInTheDocument()
    expect(screen.getByText('June 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('5 min read')).toBeInTheDocument()
  })

  it('links to the article slug', () => {
    renderWithRouter(<BlogCard post={mockPost} />)
    expect(screen.getByRole('link', { name: mockPost.title })).toHaveAttribute('href', '/blog/test-post')
  })

  it('shows state badge and tag labels', () => {
    renderWithRouter(<BlogCard post={mockPost} />)
    expect(screen.getByText('California')).toBeInTheDocument()
    expect(screen.getByText('guides')).toBeInTheDocument()
  })
})
