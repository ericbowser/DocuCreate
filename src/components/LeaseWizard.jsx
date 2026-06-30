import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { STATE_LAWS, STATES } from '../data/stateLaws'
import { DOC_TYPES, getDocType } from '../data/documentTypes'
import { buildMoveInCosts, fmt } from '../utils/leaseCalcs'
import {
  loadWizardDraft,
  saveWizardDraft,
  getEditingDocumentId,
  saveDocumentAccessToken,
  rememberRecentDocument,
  clearSensitiveClientData,
  WIZARD_IDLE_MS,
  DEFAULT_FORM,
} from '../utils/wizardStorage'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'
import { useAccessPolicy } from '../hooks/useAccessPolicy'
import { validateRecoveryPin } from '../config/recoveryPin'
import {
  DocTypeIcon,
  IconWell,
  IconBadge,
  HiOutlineBanknotes,
  HiOutlineKey,
  HiOutlineCurrencyDollar,
  HiOutlineInboxArrowDown,
  HiOutlineCalendarDays,
  HiCheck,
} from '../icons'
import VacateNoticeFields from './VacateNoticeFields'
import {
  getDefaultVacateNoticeDays,
  getVacateRules,
  validateVacateNotice,
} from '../utils/stateLawService'
import { LegalNotice } from './LegalNotice'
import { STATE_LAWS_LAST_REVIEWED } from '../content/legalDisclaimer'
import PhoneInput from './PhoneInput'
import AddressFields from './AddressFields'
import { PHONE_VALIDATE } from '../utils/phoneFormat'
import { resolveLandlordAddress, resolvePropertyAddress } from '../utils/addressFormat'
import { resolveVacateNotice, formatVacateNoticeSummary } from '../utils/stateLawService'
import { SCREENING_PARTNER } from '../config/screeningPartner'
import TenantScreeningStep from './TenantScreeningStep'

const STEPS = [
  { id: 'doctype',    title: 'What type of lease do you need?',      subtitle: 'Choose the property type to generate the right agreement.' },
  { id: 'state',      title: 'Where is the property located?',        subtitle: 'State laws vary — we apply state-level reference rules as a starting point.' },
  { id: 'landlord',   title: 'Tell us about the landlord.',           subtitle: 'The property owner or authorized property manager.' },
  { id: 'tenant',     title: 'Tell us about the tenant.',             subtitle: 'The person or business that will be renting the property.' },
  { id: 'screening',  title: 'Have you screened this tenant?',        subtitle: 'Optional tenant screening before you sign the lease.' },
  { id: 'property',   title: 'Where is the rental located?',          subtitle: 'Street address and unit details appear on the lease.' },
  { id: 'dates',      title: 'When does the lease start?',            subtitle: 'Choose the lease type and start date.' },
  { id: 'financials', title: 'What are the financial terms?',         subtitle: 'Rent, deposits, and move-in costs.' },
  { id: 'utilities',  title: 'Which utilities are included?',         subtitle: 'Select all that the landlord covers in the rent.' },
  { id: 'pets',       title: 'What is the pet policy?',               subtitle: 'Define the rules around pets at the property.' },
  { id: 'rules',      title: 'Any additional terms or conditions?',   subtitle: 'Policies, rules, and any special conditions of tenancy.' },
  { id: 'review',     title: 'Review your lease.',                    subtitle: "Everything look good? Ready to generate your PDF." },
]

// Fields validated before proceeding from each step (index-matched to STEPS)
const STEP_FIELDS = [
  ['docType'],
  ['state'],
  ['landlordName', 'landlordStreet', 'landlordCity', 'landlordState', 'landlordZip', 'landlordPhone', 'landlordEmail'],
  ['tenantName', 'tenantPhone', 'tenantEmail'],
  [],   // screening — optional, non-blocking
  ['propertyStreet', 'propertyCity', 'propertyState', 'propertyZip', 'propertyDescription'],
  ['startDate', 'landlordNoticeDays', 'tenantNoticeDays'],
  ['monthlyRent', 'securityDeposit', 'rentDueDay', 'lateFee'],
  [],
  [],   // pets not required — commercial shows N/A
  [],
  [],
]

const UTILITIES = ['Water', 'Electric', 'Gas', 'Internet', 'Trash', 'Cable', 'Sewer']

function skipScreeningStep(isCommercial) {
  return isCommercial || !SCREENING_PARTNER.enabled
}

export default function LeaseWizard() {
  const { recoveryPasswordEnabled } = useAccessPolicy()
  const draft = loadWizardDraft()
  const editingDocumentId = draft.documentId ?? getEditingDocumentId()
  const [step, setStep] = useState(draft.step)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const { register, handleSubmit, trigger, watch, setValue, setError, clearErrors, formState: { errors } } = useForm({
    defaultValues: draft.form ?? DEFAULT_FORM,
  })
  const navigate = useNavigate()

  // Persist form + step to sessionStorage on every change (tab-scoped, not shared long-term)
  useEffect(() => {
    const sub = watch((values) => saveWizardDraft(values, step))
    return () => sub.unsubscribe()
  }, [watch, step])

  useEffect(() => {
    saveWizardDraft(watch(), step)
  }, [step, watch])

  // Clear wizard data after idle period (shared-device safety)
  useEffect(() => {
    let timer
    const resetIdle = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        clearSensitiveClientData()
        navigate('/', { replace: true })
      }, WIZARD_IDLE_MS)
    }
    resetIdle()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }))
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, resetIdle))
    }
  }, [navigate])

  const docTypeId    = watch('docType')
  const docType      = getDocType(docTypeId)
  const selectedState = watch('state')
  const leaseType    = watch('leaseType')
  const monthlyRent  = parseFloat(watch('monthlyRent')) || 0
  const stateData    = selectedState ? STATE_LAWS[selectedState] : null
  const depositMax   = stateData?.depositMax ? monthlyRent * stateData.depositMax : null
  const progress     = Math.round((step / (STEPS.length - 1)) * 100)
  const isMonthly    = leaseType === 'Month-to-Month'
  const isCommercial = docType?.isCommercial ?? false
  const allValues    = watch()
  const moveInCosts  = buildMoveInCosts(allValues)
  const vacateRules  = selectedState ? getVacateRules(selectedState) : null
  const vacateWarnings = useMemo(() => {
    if (!selectedState) return []
    return validateVacateNotice({
      stateCode: selectedState,
      landlordNoticeDays: allValues.landlordNoticeDays,
      tenantNoticeDays: allValues.tenantNoticeDays,
    }).warnings
  }, [selectedState, allValues.landlordNoticeDays, allValues.tenantNoticeDays])

  // Default notice-to-vacate days from state reference data
  useEffect(() => {
    if (!selectedState) return
    const defaults = getDefaultVacateNoticeDays(selectedState)
    if (allValues.landlordNoticeDays == null || allValues.landlordNoticeDays === '') {
      setValue('landlordNoticeDays', defaults.landlordNoticeDays)
    }
    if (allValues.tenantNoticeDays == null || allValues.tenantNoticeDays === '') {
      setValue('tenantNoticeDays', defaults.tenantNoticeDays)
    }
  }, [selectedState, setValue, allValues.landlordNoticeDays, allValues.tenantNoticeDays])

  // Skip screening step when disabled or commercial (e.g. restored draft)
  useEffect(() => {
    if (step === 4 && skipScreeningStep(isCommercial)) {
      setStep(5)
    }
  }, [step, isCommercial])

  // Default property state to lease governing state when opening property step
  useEffect(() => {
    if (step === 5 && selectedState && !watch('propertyState')) {
      setValue('propertyState', selectedState)
    }
  }, [step, selectedState, setValue, watch])

  const goNext = async () => {
    let fields = STEP_FIELDS[step]
    if (step === 6 && !isMonthly) fields = [...fields, 'endDate']
    if (step === 6) clearErrors(['landlordNoticeDays', 'tenantNoticeDays'])
    let skip = 1
    if (step === 3 && skipScreeningStep(isCommercial)) skip = 2
    if (step === 8 && isCommercial) skip = 2
    const valid = fields.length === 0 || await trigger(fields)
    if (step === 6 && selectedState && valid) {
      const result = validateVacateNotice({
        stateCode: selectedState,
        landlordNoticeDays: allValues.landlordNoticeDays,
        tenantNoticeDays: allValues.tenantNoticeDays,
      })
      if (!result.valid) {
        result.errors.forEach((msg) => {
          if (msg.toLowerCase().includes('landlord')) setError('landlordNoticeDays', { type: 'manual', message: msg })
          else if (msg.toLowerCase().includes('tenant')) setError('tenantNoticeDays', { type: 'manual', message: msg })
        })
        return
      }
    }
    if (valid) setStep(s => s + skip)
  }

  const goBack = () => {
    let skip = 1
    if (step === 5 && skipScreeningStep(isCommercial)) skip = 2
    if (step === 10 && isCommercial) skip = 2
    setStep(s => s - skip)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    setSubmitError(null)
    const { recoveryPassword, recoveryPasswordConfirm, tenantScreeningStatus, ...formData } = data
    if (recoveryPassword || recoveryPasswordConfirm) {
      const pinError = validateRecoveryPin(recoveryPassword)
      if (pinError) {
        setSubmitError(pinError)
        setSubmitting(false)
        return
      }
      if (recoveryPassword !== recoveryPasswordConfirm) {
        setSubmitError('PINs do not match.')
        setSubmitting(false)
        return
      }
    }
    const payload = {
      ...formData,
      landlordAddress: resolveLandlordAddress(formData),
      propertyAddress: resolvePropertyAddress(formData),
      stateName: stateData?.name,
      stateData,
      docType: docType,
    }
    try {
      const isUpdate = Boolean(editingDocumentId)
      let res = await apiFetch(
        isUpdate ? `/api/documents/${editingDocumentId}` : '/api/documents/create',
        {
          method:  isUpdate ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ leaseData: payload }),
          documentId: editingDocumentId ?? undefined,
        },
      )
      let json = await parseJsonResponse(res)
      let recreated = false

      if (!res.ok && isUpdate && res.status === 404) {
        res = await apiFetch('/api/documents/create', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ leaseData: payload }),
        })
        json = await parseJsonResponse(res)
        recreated = true
      }

      if (!res.ok) {
        throw new Error(json.error || (isUpdate ? 'Could not update document' : 'Could not create document'))
      }

      const documentId = json.documentId ?? editingDocumentId
      if (json.accessToken) saveDocumentAccessToken(documentId, json.accessToken)
      if (recoveryPassword && json.accessToken) {
        const pwRes = await apiFetch(`/api/documents/${documentId}/recovery-password`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ password: recoveryPassword }),
          documentId,
        })
        const pwJson = await parseJsonResponse(pwRes)
        if (!pwRes.ok) throw new Error(pwJson.error || 'Could not save PIN')
      }
      rememberRecentDocument(documentId, formData.tenantName || formData.landlordName || 'Lease')
      saveWizardDraft(formData, step, documentId)
      navigate(`/preview/${documentId}`, recreated ? { state: { recreated: true } } : undefined)
    } catch (err) {
      setSubmitError(err.message || 'Could not save document. Is the server running?')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card-surface overflow-hidden">

      {/* ── Progress Bar ── */}
      <div className="px-8 pt-6 pb-4 border-b border-line dark:border-white/[0.10]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-subtle">Step {step + 1} of {STEPS.length}</span>
          <span className="text-xs font-semibold text-accent dark:text-white">{progress}% complete</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-white/[0.10] rounded-full h-1.5">
          <div className="progress-bar-fill h-1.5 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3 px-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < step
                ? 'bg-accent dark:bg-red-700'
                : i === step
                  ? 'bg-accent ring-2 ring-blue-200 dark:ring-red-900/60 dark:bg-red-600'
                  : 'bg-slate-200 dark:bg-white/[0.12]'
            }`} />
          ))}
        </div>
      </div>

      {/* ── Step Content ── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-8 py-8 min-h-[440px] flex flex-col">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-heading leading-snug">{STEPS[step].title}</h2>
            <p className="text-sm text-muted mt-1">{STEPS[step].subtitle}</p>
          </div>

          <div className="flex-1">

            {/* ── Step 0: Document Type ── */}
            {step === 0 && (
              <div className="space-y-3">
                {errors.docType && <p className="text-xs text-red-600 dark:text-red-400">{errors.docType.message}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {DOC_TYPES.map((type, i) => {
                    const isSelected = docTypeId === type.id
                    return (
                      <label
                        key={type.id}
                        className={`${i === DOC_TYPES.length - 1 && DOC_TYPES.length % 2 !== 0 ? 'col-span-2' : ''}
                          wizard-option-card ${isSelected ? 'wizard-option-card-selected' : ''}`}
                      >
                        <input type="radio" value={type.id}
                          {...register('docType', { required: 'Please select a lease type' })}
                          className="sr-only" />
                        <IconWell>
                          <DocTypeIcon typeId={type.id} className="w-7 h-7 text-blue-700 dark:text-white" />
                        </IconWell>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-800 dark:text-white' : 'text-body'}`}>
                          {type.label}
                        </span>
                        <span className="text-xs text-muted leading-tight">{type.desc}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Step 1: State ── */}
            {step === 1 && (
              <div className="space-y-4">
                <Field label="Select State" error={errors.state}>
                  <select {...register('state', { required: 'Please select a state' })} className={selectClass(errors.state)}>
                    <option value="">— Select a state —</option>
                    {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </Field>
                <LegalNotice className="mb-1" />
                {stateData && (
                  <div className="info-panel space-y-2">
                    <p className="text-xs font-bold text-blue-800 dark:text-white uppercase tracking-widest mb-1">
                      {stateData.name} — Reference summary
                    </p>
                    <p className="text-xs text-subtle mb-3">
                      General state-level guidance only (last reviewed {STATE_LAWS_LAST_REVIEWED}). Not legal advice. Local ordinances may also apply.
                    </p>
                    <InfoRow icon={HiOutlineBanknotes} label="Security Deposit" value={stateData.depositNote} />
                    <InfoRow icon={HiOutlineKey} label="Notice to Enter" value={stateData.noticeToEnter} />
                    <InfoRow icon={HiOutlineCurrencyDollar} label="Late Fees" value={stateData.lateFeeNote} />
                    <InfoRow icon={HiOutlineInboxArrowDown} label="Deposit Return" value={`Within ${stateData.returnDays} days of move-out`} />
                    {vacateRules && (
                      <InfoRow
                        icon={HiOutlineCalendarDays}
                        label="Notice to Vacate"
                        value={`Landlord min. ${vacateRules.landlordMinDays} days · Tenant min. ${vacateRules.tenantMinDays} days`}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Landlord ── */}
            {step === 2 && (
              <div className="grid grid-cols-1 gap-4">
                <Field label="Full Legal Name" error={errors.landlordName}>
                  <input {...register('landlordName', { required: 'Required' })} className={inputClass(errors.landlordName)} placeholder="John Smith" autoFocus />
                </Field>
                <AddressFields prefix="landlord" register={register} errors={errors} inputClass={inputClass} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone" error={errors.landlordPhone}>
                    <PhoneInput
                      name="landlordPhone"
                      register={(name) => register(name, PHONE_VALIDATE)}
                      setValue={setValue}
                      watch={watch}
                      className={inputClass(errors.landlordPhone)}
                    />
                  </Field>
                  <Field label="Email" error={errors.landlordEmail}>
                    <input type="email" {...register('landlordEmail', { required: 'Required' })} className={inputClass(errors.landlordEmail)} placeholder="landlord@email.com" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 3: Tenant ── */}
            {step === 3 && (
              <div className="grid grid-cols-1 gap-4">
                {isCommercial && (
                  <Field label="Business Name — optional">
                    <input {...register('businessName')} className={inputClass()} placeholder="e.g. Acme Corp LLC" />
                  </Field>
                )}
                <Field label="Full Legal Name" error={errors.tenantName}>
                  <input {...register('tenantName', { required: 'Required' })} className={inputClass(errors.tenantName)} placeholder="Jane Doe" autoFocus />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone" error={errors.tenantPhone}>
                    <PhoneInput
                      name="tenantPhone"
                      register={(name) => register(name, PHONE_VALIDATE)}
                      setValue={setValue}
                      watch={watch}
                      className={inputClass(errors.tenantPhone)}
                    />
                  </Field>
                  <Field label="Email" error={errors.tenantEmail}>
                    <input type="email" {...register('tenantEmail', { required: 'Required' })} className={inputClass(errors.tenantEmail)} placeholder="tenant@email.com" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 4: Tenant screening (residential only) ── */}
            {step === 4 && !skipScreeningStep(isCommercial) && (
              <TenantScreeningStep
                register={register}
                watch={watch}
                selectedState={selectedState}
              />
            )}

            {/* ── Step 5: Property ── */}
            {step === 5 && (
              <div className="grid grid-cols-1 gap-5">
                <AddressFields prefix="property" register={register} errors={errors} inputClass={inputClass} streetAutoFocus />
                <Field label={docType?.propertyLabel ?? 'Property Description'} error={errors.propertyDescription}>
                  <input {...register('propertyDescription', { required: 'Required' })}
                    className={inputClass(errors.propertyDescription)}
                    placeholder={docType?.propertyPlaceholder ?? 'Describe the property'} />
                </Field>
                {isCommercial && (
                  <Field label="Permitted Use — what will the space be used for?">
                    <input {...register('permittedUse')} className={inputClass()} placeholder="e.g. General office use for software company" />
                  </Field>
                )}
                {isCommercial && (
                  <Field label="Square Footage — optional">
                    <input {...register('squareFootage')} className={inputClass()} placeholder="e.g. 1,500 sq ft" />
                  </Field>
                )}
                {!isCommercial && (
                  <Field label="Furnishing Status">
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {['Unfurnished', 'Furnished', 'Partially Furnished'].map(f => (
                        <RadioCard key={f} label={f} value={f} field="furnished" register={register} watch={watch} />
                      ))}
                    </div>
                  </Field>
                )}
                {docType?.showSharedAreas && (
                  <Field label="Shared Areas — optional">
                    <input {...register('sharedAreas')} className={inputClass()} placeholder="e.g. Kitchen, living room, 1 bathroom" />
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 6: Dates ── */}
            {step === 6 && (
              <div className="grid grid-cols-1 gap-5">
                <Field label="Lease Type">
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {['Fixed Term', 'Month-to-Month'].map(t => (
                      <RadioCard key={t} label={t} value={t} field="leaseType" register={register} watch={watch} />
                    ))}
                  </div>
                </Field>
                <Field label="Start Date" error={errors.startDate}>
                  <input type="date" {...register('startDate', { required: 'Required' })} className={inputClass(errors.startDate)} />
                </Field>
                {!isMonthly && (
                  <Field label="End Date" error={errors.endDate}>
                    <input type="date" {...register('endDate', { required: 'Required' })} className={inputClass(errors.endDate)} />
                  </Field>
                )}
                <VacateNoticeFields
                  stateCode={selectedState}
                  stateName={stateData?.name}
                  leaseType={leaseType}
                  register={register}
                  errors={errors}
                  inputClass={inputClass}
                  warnings={step === 6 ? vacateWarnings : []}
                />
              </div>
            )}

            {/* ── Step 7: Financials ── */}
            {step === 7 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Monthly Rent ($)" error={errors.monthlyRent}>
                    <input type="number" {...register('monthlyRent', { required: 'Required', min: 1 })} className={inputClass(errors.monthlyRent)} placeholder="1200" autoFocus />
                  </Field>
                  <Field label="Security Deposit ($)" error={errors.securityDeposit}>
                    <input type="number" {...register('securityDeposit', { required: 'Required', min: 0 })} className={inputClass(errors.securityDeposit)} placeholder="1200" />
                  </Field>
                  <Field label="Rent Due — Day of Month" error={errors.rentDueDay}>
                    <input type="number" {...register('rentDueDay', { required: 'Required', min: 1, max: 28 })} className={inputClass(errors.rentDueDay)} placeholder="1" />
                  </Field>
                  <Field label="Late Fee ($)" error={errors.lateFee}>
                    <input type="number" {...register('lateFee', { required: 'Required', min: 0 })} className={inputClass(errors.lateFee)} placeholder="75" />
                  </Field>
                  <Field label="Key / Access Deposit ($) — optional">
                    <input type="number" {...register('keyDeposit')} className={inputClass()} placeholder="e.g. 50" />
                  </Field>
                  <Field label="Parking Deposit ($) — optional">
                    <input type="number" {...register('parkingDeposit')} className={inputClass()} placeholder="e.g. 100" />
                  </Field>
                </div>

                <label className="flex items-center gap-3 p-3.5 border card-border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all shadow-card-sm">
                  <input type="checkbox" {...register('requireLastMonth')} className="w-4 h-4 accent-blue-600 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-body">Require last month's rent at signing</span>
                    <p className="text-xs text-muted mt-0.5">Collected upfront — applied to the final month.</p>
                  </div>
                </label>

                {stateData && (
                  <div className="warn-panel space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2">{stateData.name} Financial Rules</p>
                    <p className="text-sm">
                      <span className="font-semibold">Deposit: </span>{stateData.depositNote}
                      {depositMax > 0 && <span className="block mt-1 font-medium">Max for ${monthlyRent}/mo: <strong>${fmt(depositMax)}</strong></span>}
                    </p>
                    <p className="text-sm"><span className="font-semibold">Late fees: </span>{stateData.lateFeeNote}</p>
                  </div>
                )}

                {moveInCosts.total > 0 && <MoveInPreview costs={moveInCosts} />}
              </div>
            )}

            {/* ── Step 8: Utilities ── */}
            {step === 8 && (
              <div className="space-y-3">
                <p className="text-sm text-muted">Select all that the landlord provides:</p>
                <div className="grid grid-cols-2 gap-3">
                  {UTILITIES.map(u => (
                    <label key={u} className="flex items-center gap-3 p-3.5 border card-border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all shadow-card-sm">
                      <input type="checkbox" value={u} {...register('utilities')} className="w-4 h-4 accent-blue-600 shrink-0" />
                      <span className="text-sm text-body">{u}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 9: Pets ── */}
            {step === 9 && (
              <div className="space-y-5">
                <Field label="Pet Policy" error={errors.petPolicy}>
                  <div className="grid grid-cols-1 gap-3 mt-1">
                    {['Pets Allowed', 'No Pets Allowed', 'Pets Allowed With Written Approval'].map(p => (
                      <RadioCard key={p} label={p} value={p} field="petPolicy" register={register} watch={watch} />
                    ))}
                  </div>
                </Field>
                <Field label="Pet Deposit ($) — optional">
                  <input type="number" {...register('petDeposit')} className={inputClass()} placeholder="e.g. 250" />
                </Field>
              </div>
            )}

            {/* ── Step 10: Rules ── */}
            {step === 10 && (
              <div className="space-y-4">
                <Field label={isCommercial ? 'Operating Rules / Additional Terms' : 'House Rules / Additional Terms'}>
                  <textarea {...register('houseRules')} rows={5}
                    className="input-field resize-none"
                    placeholder={isCommercial
                      ? 'e.g. Business hours 8am–8pm. No loud machinery. Common areas shared with other tenants.'
                      : 'e.g. No smoking on the premises. Quiet hours 10pm–7am. Common areas must be kept clean.'} />
                </Field>
                {stateData?.disclosures?.length > 0 && (
                  <div className="info-panel">
                    <p className="text-xs font-bold text-blue-800 dark:text-white uppercase tracking-widest mb-3">{stateData.name} — Required Disclosures</p>
                    <ul className="space-y-1.5">
                      {stateData.disclosures.map((d, i) => (
                        <li key={i} className="flex gap-2 text-sm text-blue-900 dark:text-white">
                          <HiCheck className="w-4 h-4 text-blue-500 dark:text-ember-400 mt-0.5 shrink-0" aria-hidden="true" /><span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 11: Review ── */}
            {step === 11 && (
              <div className="space-y-4">
                {editingDocumentId && (
                  <div className="info-panel text-sm text-body">
                    Editing your existing lease. Changes will update the same document when you click Update Lease.
                  </div>
                )}
                <ReviewSummary watch={watch} stateData={stateData} docType={docType} moveInCosts={moveInCosts} />
                {recoveryPasswordEnabled && (
                <div className="border card-border rounded-xl p-4 space-y-3 bg-slate-50/80 dark:bg-white/[0.04]">
                  <p className="text-sm font-medium text-heading">Landlord recovery PIN (optional)</p>
                  <p className="text-xs text-muted">
                    Set a PIN to reopen this lease later from the home page without saving a lease file.
                    Numbers only is fine (e.g. 4 digits).
                  </p>
                  <Field label="Recovery PIN">
                    <input
                      type="password"
                      inputMode="numeric"
                      {...register('recoveryPassword')}
                      className={inputClass()}
                      autoComplete="off"
                      placeholder="At least 4 characters"
                    />
                  </Field>
                  <Field label="Confirm recovery PIN">
                    <input
                      type="password"
                      inputMode="numeric"
                      {...register('recoveryPasswordConfirm')}
                      className={inputClass()}
                      autoComplete="off"
                    />
                  </Field>
                </div>
                )}
                <LegalNotice />
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div className="px-8 pb-2">
            <p className="alert-error text-sm">{submitError}</p>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button type="button" onClick={goBack} disabled={step === 0}
            className="px-5 py-2.5 border card-border rounded-xl text-sm text-body hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← Back
          </button>
          {step < STEPS.length - 1
            ? <button type="button" onClick={goNext} className="px-7 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">Continue →</button>
            : <button type="submit" disabled={submitting} className="px-7 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                {submitting
                  ? (editingDocumentId ? 'Updating…' : 'Creating…')
                  : (editingDocumentId ? 'Update Lease →' : 'Generate Lease →')}
              </button>
          }
        </div>
      </form>
    </div>
  )
}

// ── Move-In Cost Preview ──
function MoveInPreview({ costs }) {
  return (
    <div className="border card-border rounded-xl overflow-hidden shadow-card-sm">
      <div className="bg-slate-50 dark:bg-white/[0.06] px-4 py-2.5 border-b border-line dark:border-white/[0.10]">
        <p className="text-xs font-bold text-muted uppercase tracking-widest">Move-In Cost Preview</p>
      </div>
      <div className="divide-y divide-line dark:divide-line-dark">
        {costs.lines.map((line, i) => (
          <div key={i} className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-muted">{line.label}</span>
            <span className="text-sm font-medium text-heading">${fmt(line.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between px-4 py-3 bg-green-600/70">
        <span className="text-sm font-bold text-white">Total Due at Signing</span>
        <span className="text-sm font-bold text-white">${fmt(costs.total)}</span>
      </div>
    </div>
  )
}

// ── Review Summary ──
const REVIEW_SENSITIVE = new Set(['Landlord', 'Tenant', 'Business', 'Property', 'Landlord mail', 'Description', 'Permitted Use'])

function ReviewSummary({ watch, stateData, docType, moveInCosts }) {
  const [revealed, setRevealed] = useState(false)
  const v         = watch()
  const isMonthly = v.leaseType === 'Month-to-Month'
  const { landlordNoticeDays, tenantNoticeDays } = resolveVacateNotice(v)
  const period    = isMonthly
    ? `Month-to-Month from ${v.startDate}`
    : v.startDate && v.endDate ? `${v.startDate} – ${v.endDate}` : '—'
  const noticeSummary = formatVacateNoticeSummary({
    leaseType: v.leaseType,
    landlordNoticeDays,
    tenantNoticeDays,
    isMonthly,
  })

  const display = (label, value) => {
    if (revealed || !REVIEW_SENSITIVE.has(label)) return value || '—'
    if (!value) return '—'
    return '••••••••'
  }

  const rows = [
    { label: 'Lease Type',    value: docType?.label },
    { label: 'State',         value: stateData?.name ?? v.state },
    { label: 'Landlord',      value: v.landlordName },
    { label: 'Tenant',        value: v.tenantName },
    { label: 'Business',      value: v.businessName,         hide: !v.businessName },
    { label: 'Property',      value: resolvePropertyAddress(v) },
    { label: 'Landlord mail', value: resolveLandlordAddress(v), hide: !resolveLandlordAddress(v) },
    { label: 'Description',   value: v.propertyDescription },
    { label: 'Permitted Use', value: v.permittedUse,         hide: !v.permittedUse },
    { label: 'Furnished',     value: v.furnished,            hide: docType?.isCommercial },
    { label: 'Term',          value: v.leaseType },
    { label: 'Period',        value: period },
    { label: 'Notice to Vacate', value: noticeSummary },
    { label: 'Monthly Rent',  value: v.monthlyRent ? `$${fmt(v.monthlyRent)}` : '—' },
    { label: 'Rent Due',      value: v.rentDueDay ? `Day ${v.rentDueDay} of each month` : '—' },
    { label: 'Late Fee',      value: v.lateFee ? `$${v.lateFee}` : '—' },
    { label: 'Utilities',     value: Array.isArray(v.utilities) && v.utilities.length ? v.utilities.join(', ') : 'None included' },
    { label: 'Pet Policy',    value: v.petPolicy ?? '—',     hide: docType?.isCommercial },
  ].filter(r => !r.hide)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Personal details are hidden by default on shared screens.
        </p>
        <button
          type="button"
          onClick={() => setRevealed(r => !r)}
          className="text-xs font-medium text-accent hover:underline shrink-0"
        >
          {revealed ? 'Hide details' : 'Reveal details'}
        </button>
      </div>
      <div className="divide-y divide-line dark:divide-line-dark">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-4 py-2">
            <span className="text-sm text-muted w-36 shrink-0">{label}</span>
            <span className="text-sm font-medium text-heading">{display(label, value)}</span>
          </div>
        ))}
      </div>
      {moveInCosts.total > 0 && <MoveInPreview costs={moveInCosts} />}
    </div>
  )
}

// ── Shared Sub-Components ──
function RadioCard({ label, value, field, register, watch, required }) {
  const isSelected = watch(field) === value
  return (
    <label className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all shadow-card-sm ${
      isSelected
        ? 'border-accent bg-accent-muted dark:bg-ember-900/40 dark:border-ember-500/55 dark:ring-1 dark:ring-ember-400/25'
        : 'border-line dark:border-white/[0.12] hover:bg-slate-50 dark:hover:bg-white/[0.08]'
    }`}>
      <input type="radio" value={value} {...register(field, required ? { required } : {})} className="w-4 h-4 accent-blue-600 shrink-0" />
      <span className={`text-sm ${isSelected ? 'font-semibold text-blue-800 dark:text-white' : 'text-body'}`}>{label}</span>
    </label>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-body">{label}</label>
      {children}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error.message}</span>}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-2.5 text-sm items-start">
      <IconBadge><Icon className="w-4 h-4 text-blue-700 dark:text-white" /></IconBadge>
      <span className="font-semibold text-blue-800 dark:text-white w-32 shrink-0">{label}:</span>
      <span className="text-blue-900 dark:text-white/90">{value}</span>
    </div>
  )
}

function inputClass(error) {
  return ['input-field', error ? 'input-field-error' : ''].filter(Boolean).join(' ')
}

function selectClass(error) {
  return ['input-field', error ? 'input-field-error' : ''].filter(Boolean).join(' ')
}
