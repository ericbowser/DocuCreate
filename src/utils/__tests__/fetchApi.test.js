import { apiUrl, apiFetch, parseJsonResponse } from '../fetchApi'
import { saveDocumentAccessToken } from '../wizardStorage'

jest.mock('../api', () => ({
  getApiBase: () => 'https://api.example.com',
  API: 'https://api.example.com',
}))

describe('fetchApi', () => {
  describe('apiUrl', () => {
    it('joins API base with path', () => {
      expect(apiUrl('/api/health')).toBe('https://api.example.com/api/health')
      expect(apiUrl('api/documents')).toBe('https://api.example.com/api/documents')
    })
  })

  describe('apiFetch', () => {
    it('requests with no-store cache', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({}),
      })
      await apiFetch('/api/health')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/health',
        expect.objectContaining({ cache: 'no-store', credentials: 'same-origin' }),
      )
    })

    it('sends X-Doc-Access when document token is stored', async () => {
      saveDocumentAccessToken('doc-abc', 'secret-token')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({}),
      })
      await apiFetch('/api/documents/doc-abc', { documentId: 'doc-abc' })
      const [, options] = global.fetch.mock.calls[0]
      expect(options.headers.get('X-Doc-Access')).toBe('secret-token')
    })
  })

  describe('parseJsonResponse', () => {
    it('parses JSON responses', async () => {
      const res = {
        ok: true,
        headers: { get: (name) => (name === 'content-type' ? 'application/json' : null) },
        json: async () => ({ ok: true }),
      }
      await expect(parseJsonResponse(res)).resolves.toEqual({ ok: true })
    })

    it('throws helpful error for HTML responses', async () => {
      const res = {
        ok: false,
        status: 502,
        headers: { get: (name) => (name === 'content-type' ? 'text/html' : null) },
        text: async () => '<!DOCTYPE html><html></html>',
      }
      await expect(parseJsonResponse(res)).rejects.toThrow(/API unavailable/i)
    })
  })
})
