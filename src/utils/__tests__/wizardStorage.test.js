import {
  loadWizardDraft,
  saveWizardDraft,
  clearWizardDraft,
  clearSensitiveClientData,
  getEditingDocumentId,
  saveDocumentAccessToken,
  getDocumentAccessToken,
  leaseDataToWizardForm,
  WIZARD_REVIEW_STEP,
} from '../wizardStorage'

describe('wizardStorage', () => {
  it('persists and loads form data', () => {
    saveWizardDraft({ tenantName: 'Jane Doe', monthlyRent: '1200' }, 3, 'doc-123')
    const draft = loadWizardDraft()
    expect(draft.form.tenantName).toBe('Jane Doe')
    expect(draft.step).toBe(3)
    expect(draft.documentId).toBe('doc-123')
  })

  it('returns empty draft when nothing stored', () => {
    const draft = loadWizardDraft()
    expect(draft.form).toBeNull()
    expect(draft.step).toBe(0)
    expect(draft.documentId).toBeNull()
  })

  it('clears stored draft', () => {
    saveWizardDraft({ tenantName: 'Test' }, 1, 'abc')
    clearWizardDraft()
    expect(loadWizardDraft().form).toBeNull()
    expect(getEditingDocumentId()).toBeNull()
  })

  it('clearSensitiveClientData removes wizard keys from sessionStorage', () => {
    saveWizardDraft({ tenantName: 'Jane' }, 2, 'doc-1')
    sessionStorage.setItem('leaseData', '{"old":true}')
    clearSensitiveClientData()
    expect(loadWizardDraft().form).toBeNull()
    expect(sessionStorage.getItem('leaseData')).toBeNull()
  })

  it('maps lease data back to wizard form', () => {
    const form = leaseDataToWizardForm({
      stateName: 'Utah',
      landlordName: 'Bob',
      tenantName: 'Alice',
      monthlyRent: 900,
      landlordNoticeDays: 30,
      tenantNoticeDays: 30,
    })
    expect(form.landlordName).toBe('Bob')
    expect(form.state).toBe('UT')
    expect(form.landlordNoticeDays).toBe(30)
  })

  it('exports review step constant', () => {
    expect(WIZARD_REVIEW_STEP).toBe(10)
  })

  it('stores document access tokens by document id', () => {
    saveDocumentAccessToken('doc-99', 'tok-xyz')
    expect(getDocumentAccessToken('doc-99')).toBe('tok-xyz')
    expect(getDocumentAccessToken('other')).toBeNull()
  })

  it('obfuscates wizard draft in sessionStorage', () => {
    saveWizardDraft({ tenantName: 'Secret Tenant' }, 2, 'doc-1')
    const raw = sessionStorage.getItem('docucreate:wizard:form')
    expect(raw).toBeTruthy()
    expect(raw).not.toContain('Secret Tenant')
    expect(loadWizardDraft().form.tenantName).toBe('Secret Tenant')
  })
})
