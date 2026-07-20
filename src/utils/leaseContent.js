import { buildMoveInCosts, fmt, buildFirstMonthReceivedParagraph } from './leaseCalcs'
import { resolveLandlordAddress, resolvePropertyAddress } from './addressFormat'
import { displayPhone } from './phoneFormat'
import {
  resolveVacateNotice,
  buildLeasePeriodText,
  buildVacateClauseText,
  formatVacateNoticeSummary,
} from './stateLawService'

export function buildLeaseContent(data) {
  const landlordAddress = resolveLandlordAddress(data)
  const propertyAddress = resolvePropertyAddress(data)

  const {
    docType: dt,
    stateName, stateData,
    landlordName, landlordPhone, landlordEmail,
    tenantName, tenantPhone, tenantEmail, businessName,
    propertyDescription, roomDescription,
    sharedAreas, permittedUse, squareFootage, furnished,
    leaseType, startDate, endDate,
    monthlyRent, securityDeposit, rentDueDay, lateFee,
    utilities, petPolicy, petDeposit, houseRules,
    tenantPrintedName, tenantSignedAt,
    landlordPrintedName, landlordSignedAt,
    tenantSignatureData, landlordSignatureData,
  } = data

  const propDesc     = propertyDescription || roomDescription || ''
  const isMonthly    = leaseType === 'Month-to-Month'
  const isCommercial = dt?.isCommercial ?? false
  const leaseTitle   = dt?.leaseTitle ?? 'LEASE AGREEMENT'
  const propLabel    = dt?.propertyLabel ?? 'Property Description'
  const tenantLabel  = dt?.tenantLabel ?? 'Tenant'
  const docTypeLabel = dt?.label ?? ''

  const utilitiesText = Array.isArray(utilities) && utilities.length > 0
    ? utilities.join(', ')
    : 'None — tenant is responsible for all utilities'

  const today       = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const moveIn      = buildMoveInCosts(data)
  const firstMonthReceivedParagraph = buildFirstMonthReceivedParagraph(moveIn)
  const returnDays  = stateData?.returnDays ?? 30
  const enterNotice = stateData?.noticeToEnter ?? '24 hours'
  const state = stateName ?? 'the applicable state'
  const { landlordNoticeDays, tenantNoticeDays } = resolveVacateNotice(data)
  const leasePeriodText = buildLeasePeriodText({
    leaseType, startDate, endDate, landlordNoticeDays, tenantNoticeDays,
  })
  const vacateNoticeSummary = formatVacateNoticeSummary({
    leaseType, landlordNoticeDays, tenantNoticeDays, isMonthly,
  })
  const vacateClauseText = buildVacateClauseText({
    isMonthly, state, landlordNoticeDays, tenantNoticeDays, startDate, endDate,
  })

  const depositParagraph = `The security deposit may be applied toward: (a) unpaid rent; (b) cleaning costs exceeding normal wear and tear; (c) damages beyond normal wear and tear; (d) other lawful charges. Landlord shall provide a written itemized statement of deductions within ${returnDays} days of Tenant vacating.`

  const clauses = [
    {
      num: 1,
      title: 'Security Deposit Terms',
      text: `The security deposit of $${fmt(securityDeposit)} is held as security for all obligations under this Agreement. Landlord shall return the deposit within ${returnDays} days of move-out with a written itemized statement of any deductions. Permitted deductions include unpaid rent, cleaning beyond normal wear and tear, damages, and other lawful charges under ${state} law. Tenant must provide a forwarding address to receive the deposit refund.`,
    },
    {
      num: 2,
      title: 'Right of Entry and Inspection',
      text: `Landlord shall provide at least ${enterNotice} advance notice before entering the property for non-emergency purposes. In emergencies threatening life or property, Landlord may enter immediately. Landlord shall respect Tenant's right to privacy at all times.`,
    },
    {
      num: 3,
      title: 'Maintenance and Repairs',
      text: `Landlord shall maintain the premises in a habitable condition as required by ${state} law, including heating, plumbing, and structural safety. Tenant shall keep the property clean, dispose of garbage properly, promptly notify Landlord of needed repairs, and not make alterations without prior written consent.`,
    },
    {
      num: 4,
      title: 'Quiet Enjoyment',
      text: `Landlord covenants that Tenant shall have quiet enjoyment and peaceful possession of the property throughout the lease term, provided Tenant complies with all terms herein.`,
    },
    {
      num: 5,
      title: 'Notice to Vacate',
      text: vacateClauseText,
    },
    isCommercial
      ? {
          num: 6,
          title: 'Permitted Use',
          text: `Tenant shall use the premises solely for the permitted use stated herein${permittedUse ? ` (${permittedUse})` : ''} and for no other purpose without Landlord's prior written consent. Tenant shall comply with all applicable zoning laws, business licenses, permits, and regulations. Tenant shall not use the premises for any illegal or hazardous activity.`,
        }
      : {
          num: 6,
          title: 'Tenant Responsibilities',
          text: `Tenant agrees to: (a) pay rent on time; (b) maintain cleanliness; (c) refrain from illegal activities; (d) not disturb other occupants or neighbors; (e) comply with all applicable laws; (f) not sublet without written landlord approval; (g) report pest infestations, water damage, or structural concerns promptly.`,
        },
    {
      num: 7,
      title: 'Default and Remedies',
      text: `Failure by Tenant to pay rent when due, or material violation of any term of this Agreement, constitutes a default. Landlord shall provide written notice as required by ${state} law before pursuing remedies including eviction. Tenant shall have the right to cure certain defaults within the statutory cure period.`,
    },
    {
      num: 8,
      title: 'Abandonment',
      text: `If Tenant vacates before the lease term ends without written notice, Tenant may be liable for remaining rent as permitted under ${state} law. Landlord shall make reasonable efforts to re-rent the premises to mitigate damages.`,
    },
    {
      num: 9,
      title: 'Indemnification',
      text: `Tenant shall indemnify and hold Landlord harmless from claims, damages, or expenses arising from Tenant's negligent or intentional acts or omissions. This does not apply to claims arising from Landlord's own negligence or willful misconduct.`,
    },
    {
      num: 10,
      title: 'Notices',
      text: `All notices shall be in writing and delivered by personal delivery, certified mail, or email with confirmation to the addresses listed on Page 1. Notice is effective upon delivery or three (3) business days after mailing.`,
    },
    {
      num: 11,
      title: 'Governing Law and Jurisdiction',
      text: `This Agreement is governed by the laws of ${state}. Disputes shall be resolved in the appropriate courts of ${state}. The prevailing party may recover reasonable attorney fees to the extent permitted by law.`,
    },
    {
      num: 12,
      title: 'Severability',
      text: `If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.`,
    },
    {
      num: 13,
      title: 'Entire Agreement',
      text: `This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations. Any modification must be in writing and signed by both parties. Verbal agreements are not binding.`,
    },
  ]

  const sections = [
    { id: 'parties',    label: 'Parties' },
    { id: 'property',   label: 'Property' },
    { id: 'terms',      label: 'Lease Terms' },
    { id: 'deposit',    label: 'Deposit' },
    { id: 'move-in',    label: 'Move-In Costs' },
    { id: 'utilities',  label: isCommercial ? 'Utilities' : 'Utilities & Pets' },
    ...(houseRules ? [{ id: 'rules', label: isCommercial ? 'Operating Rules' : 'House Rules' }] : []),
    ...(stateData?.disclosures?.length ? [{ id: 'disclosures', label: 'Disclosures' }] : []),
    { id: 'standard',   label: 'Standard Terms' },
    { id: 'signatures', label: 'Signatures' },
  ]

  return {
    leaseTitle, docTypeLabel, stateName, propLabel, tenantLabel,
    isMonthly, isCommercial, today, moveIn, firstMonthReceivedParagraph, clauses, sections,
    landlordName, landlordAddress,
    landlordPhone: displayPhone(landlordPhone),
    landlordEmail,
    businessName, tenantName,
    tenantPhone: displayPhone(tenantPhone),
    tenantEmail,
    propertyAddress, propDesc, furnished, sharedAreas, permittedUse, squareFootage,
    leaseType, leasePeriodText, landlordNoticeDays, tenantNoticeDays, vacateNoticeSummary,
    monthlyRent, rentDueDay, lateFee,
    securityDeposit, returnDays, state, depositParagraph,
    utilitiesText, petPolicy, petDeposit, houseRules,
    tenantPrintedName, tenantSignedAt,
    landlordPrintedName, landlordSignedAt,
    tenantSignatureData, landlordSignatureData,
  }
}
