import { render, screen, waitFor } from '@testing-library/react'
import PageMeta from '../PageMeta'
import { APP_NAME } from '../../config/brand'

describe('PageMeta', () => {
  it('sets document title and description', async () => {
    render(<PageMeta title="Blog" description="Lease guides and tips." />)
    await waitFor(() => {
      expect(document.title).toBe(`Blog | ${APP_NAME}`)
    })
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Lease guides and tips.',
    )
  })

  it('sets canonical URL when provided', async () => {
    render(
      <PageMeta
        title="Article"
        description="Excerpt"
        canonical="https://docu-create.com/blog/test"
      />,
    )
    await waitFor(() => {
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://docu-create.com/blog/test',
      )
    })
  })

  it('sets noindex robots meta when requested', async () => {
    render(
      <PageMeta
        title="Blog"
        description="Filtered"
        canonical="https://docu-create.com/blog"
        noindex
      />,
    )
    await waitFor(() => {
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      )
    })
  })

  it('sets private cache headers for sensitive pages', async () => {
    render(<PageMeta title="Preview" noindex privateSession />)
    await waitFor(() => {
      expect(document.querySelector('meta[http-equiv="Cache-Control"]')).toHaveAttribute(
        'content',
        'no-store, no-cache, must-revalidate, private',
      )
    })
  })

  it('restores title on unmount', async () => {
    document.title = 'Original'
    const { unmount } = render(<PageMeta title="Temporary" description="Desc" />)
    await waitFor(() => expect(document.title).toContain('Temporary'))
    unmount()
    expect(document.title).toBe('Original')
  })
})
