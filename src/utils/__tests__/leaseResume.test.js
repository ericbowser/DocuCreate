import { buildResumeBundle, parseResumeBundle } from '../leaseResume'

describe('leaseResume', () => {
  it('builds and parses a resume bundle', () => {
    const bundle = buildResumeBundle({
      documentId: 'a894dad8-bc94-4a70-a5d1-3cff46ada853',
      accessToken: 'tok-abc',
      label: 'Jane',
    })
    const parsed = parseResumeBundle(JSON.stringify(bundle))
    expect(parsed.documentId).toBe('a894dad8-bc94-4a70-a5d1-3cff46ada853')
    expect(parsed.accessToken).toBe('tok-abc')
    expect(parsed.label).toBe('Jane')
  })

  it('parses minimal documentId + accessToken export', () => {
    const parsed = parseResumeBundle({
      documentId: 'a894dad8-bc94-4a70-a5d1-3cff46ada853',
      accessToken: 'secret',
    })
    expect(parsed.documentId).toBe('a894dad8-bc94-4a70-a5d1-3cff46ada853')
    expect(parsed.accessToken).toBe('secret')
  })

  it('allows documentId-only bundle for legacy leases', () => {
    const result = parseResumeBundle({
      type: 'docucreate-resume',
      documentId: 'a894dad8-bc94-4a70-a5d1-3cff46ada853',
    })
    expect(result.documentId).toBe('a894dad8-bc94-4a70-a5d1-3cff46ada853')
    expect(result.accessToken).toBeNull()
    expect(result.legacyNoToken).toBe(true)
  })

  it('recovers documentId from server signing store JSON', () => {
    const parsed = parseResumeBundle({
      '1e7071a9-7ae8-4f2a-8dad-b0035d7538a7': {
        token: '1e7071a9-7ae8-4f2a-8dad-b0035d7538a7',
        documentId: 'a894dad8-bc94-4a70-a5d1-3cff46ada853',
        leaseData: { tenantName: 'Tyrelle Jamison' },
      },
    })
    expect(parsed.documentId).toBe('a894dad8-bc94-4a70-a5d1-3cff46ada853')
    expect(parsed.legacyNoToken).toBe(true)
    expect(parsed.importedFrom).toBe('signing-store')
  })

  it('rejects invalid bundle type', () => {
    expect(parseResumeBundle({ version: 1 }).error).toMatch(/not a valid/i)
  })

  it('rejects invalid JSON', () => {
    expect(parseResumeBundle('{ not json').error).toMatch(/Invalid lease file format/i)
  })
})
