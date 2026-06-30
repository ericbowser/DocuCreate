import { buildPartnerUrl } from '../screeningPartner'

describe('buildPartnerUrl', () => {
  it('appends UTM params to partner base URL', () => {
    const url = new URL(buildPartnerUrl({ state: 'TX' }))
    expect(url.hostname).toBe('www.rentprep.com')
    expect(url.searchParams.get('utm_source')).toBe('docucreate')
    expect(url.searchParams.get('utm_medium')).toBe('wizard')
    expect(url.searchParams.get('utm_campaign')).toBe('tenant_screening')
    expect(url.searchParams.get('state')).toBe('TX')
  })

  it('omits state when not provided', () => {
    const url = new URL(buildPartnerUrl())
    expect(url.searchParams.has('state')).toBe(false)
  })
})
