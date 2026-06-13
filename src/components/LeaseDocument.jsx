import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { APP_NAME } from '../config/brand'
import { buildMoveInCosts, fmt } from '../utils/leaseCalcs'
import { buildLeaseContent } from '../utils/leaseContent'

const S = StyleSheet.create({
  page:          { padding: 52, fontSize: 10.5, fontFamily: 'Helvetica', color: '#1a1a1a', lineHeight: 1.4 },
  page2:         { padding: 52, fontSize: 10,   fontFamily: 'Helvetica', color: '#1a1a1a', lineHeight: 1.5 },
  header:        { borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 10, marginBottom: 16 },
  title:         { fontSize: 17, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.5 },
  subtitle:      { fontSize: 9.5, textAlign: 'center', color: '#666', marginTop: 3 },
  typeBadge:     { textAlign: 'center', fontSize: 9, color: '#6b7280', marginTop: 2 },
  stateBadge:    { textAlign: 'center', fontSize: 9, color: '#2563eb', marginTop: 2, fontWeight: 'bold' },
  sectionTitle:  { fontSize: 10, fontWeight: 'bold', marginTop: 16, marginBottom: 5, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#d1d5db', textTransform: 'uppercase', letterSpacing: 0.8, color: '#374151' },
  row:           { flexDirection: 'row', marginBottom: 4 },
  label:         { width: 155, fontWeight: 'bold', color: '#4b5563', fontSize: 10 },
  value:         { flex: 1, color: '#1a1a1a', fontSize: 10 },
  paragraph:     { marginBottom: 6, lineHeight: 1.6, fontSize: 10 },
  clauseTitle:   { fontSize: 10, fontWeight: 'bold', color: '#1f2937', marginTop: 12, marginBottom: 3 },
  clauseText:    { fontSize: 9.5, color: '#374151', lineHeight: 1.6, marginBottom: 4 },
  costTable:     { marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  costRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  costRowAlt:    { backgroundColor: '#f9fafb' },
  costLabel:     { fontSize: 10, color: '#374151' },
  costAmount:    { fontSize: 10, color: '#111827', fontWeight: 'bold' },
  costTotalRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(22, 163, 74, 0.75)' },
  costTotalLbl:  { fontSize: 10.5, fontWeight: 'bold', color: '#fff' },
  costTotalAmt:  { fontSize: 10.5, fontWeight: 'bold', color: '#fff' },
  discBox:       { marginTop: 14, padding: 10, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', borderRadius: 4 },
  discTitle:     { fontSize: 9.5, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  discItem:      { fontSize: 9.5, color: '#1e40af', marginBottom: 3 },
  sigSection:    { marginTop: 24 },
  sigGrid:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigBlock:      { width: '47%' },
  sigLine:       { borderBottomWidth: 1, borderBottomColor: '#000', height: 36, marginBottom: 4 },
  sigLabel:      { fontSize: 8.5, color: '#6b7280' },
  sigName:       { fontSize: 8.5, color: '#374151', marginTop: 2 },
  dateLine:      { borderBottomWidth: 1, borderBottomColor: '#9ca3af', height: 22, marginTop: 10, marginBottom: 4 },
  eSigBox:       { marginTop: 20, padding: 10, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 4 },
  eSigTitle:     { fontSize: 9, fontWeight: 'bold', color: '#15803d', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  eSigText:      { fontSize: 9, color: '#166534' },
  footer:        { marginTop: 18, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

const Clause = ({ num, title, text }) => (
  <View>
    <Text style={S.clauseTitle}>{num}. {title.toUpperCase()}</Text>
    <Text style={S.clauseText}>{text}</Text>
  </View>
)

export default function LeaseDocument({ data }) {
  const c = buildLeaseContent(data)
  const {
    leaseTitle, docTypeLabel, stateName, propLabel, tenantLabel,
    isMonthly, isCommercial, today, moveIn, clauses,
    landlordName, landlordAddress, landlordPhone, landlordEmail,
    businessName, tenantName, tenantPhone, tenantEmail,
    propertyAddress, propDesc, furnished, sharedAreas, permittedUse, squareFootage,
    leaseType, leasePeriodText, landlordNoticeDays, tenantNoticeDays,
    monthlyRent, securityDeposit, rentDueDay, lateFee, returnDays, state,
    utilitiesText, petPolicy, petDeposit, houseRules,
    tenantPrintedName, tenantSignedAt,
    landlordPrintedName, landlordSignedAt,
  } = c
  const vacateClause = clauses.find((cl) => cl.title === 'Notice to Vacate')
  const stateData = data.stateData
  const enterNotice = stateData?.noticeToEnter ?? '24 hours'

  return (
    <Document>
      {/* ─── PAGE 1: SPECIFIC TERMS ─── */}
      <Page size="LETTER" style={S.page}>

        <View style={S.header}>
          <Text style={S.title}>{leaseTitle}</Text>
          <Text style={S.subtitle}>This agreement is legally binding upon the signatures of both parties below.</Text>
          {docTypeLabel && <Text style={S.typeBadge}>{docTypeLabel}</Text>}
          {stateName && <Text style={S.stateBadge}>State of {stateName}</Text>}
        </View>

        {/* Parties */}
        <Text style={S.sectionTitle}>Parties</Text>
        <View style={S.row}><Text style={S.label}>Landlord:</Text>         <Text style={S.value}>{landlordName}</Text></View>
        <View style={S.row}><Text style={S.label}>Landlord Address:</Text> <Text style={S.value}>{landlordAddress}</Text></View>
        <View style={S.row}><Text style={S.label}>Landlord Contact:</Text> <Text style={S.value}>{landlordPhone}  |  {landlordEmail}</Text></View>
        {businessName && <View style={S.row}><Text style={S.label}>Business Name:</Text><Text style={S.value}>{businessName}</Text></View>}
        <View style={S.row}><Text style={S.label}>{tenantLabel}:</Text>    <Text style={S.value}>{tenantName}</Text></View>
        <View style={S.row}><Text style={S.label}>Tenant Contact:</Text>   <Text style={S.value}>{tenantPhone}  |  {tenantEmail}</Text></View>

        {/* Property */}
        <Text style={S.sectionTitle}>Rental Property</Text>
        <View style={S.row}><Text style={S.label}>Property Address:</Text> <Text style={S.value}>{propertyAddress}</Text></View>
        <View style={S.row}><Text style={S.label}>{propLabel}:</Text>      <Text style={S.value}>{propDesc}</Text></View>
        {!isCommercial && furnished && <View style={S.row}><Text style={S.label}>Furnishing:</Text><Text style={S.value}>{furnished}</Text></View>}
        {sharedAreas && <View style={S.row}><Text style={S.label}>Shared Areas:</Text><Text style={S.value}>{sharedAreas}</Text></View>}
        {permittedUse && <View style={S.row}><Text style={S.label}>Permitted Use:</Text><Text style={S.value}>{permittedUse}</Text></View>}
        {squareFootage && <View style={S.row}><Text style={S.label}>Square Footage:</Text><Text style={S.value}>{squareFootage}</Text></View>}

        {/* Lease Terms */}
        <Text style={S.sectionTitle}>Lease Terms</Text>
        <View style={S.row}><Text style={S.label}>Lease Type:</Text>        <Text style={S.value}>{leaseType ?? 'Fixed Term'}</Text></View>
        <View style={S.row}><Text style={S.label}>Lease Period:</Text>      <Text style={S.value}>{leasePeriodText}</Text></View>
        <View style={S.row}><Text style={S.label}>Landlord Notice:</Text>  <Text style={S.value}>{landlordNoticeDays} days written notice to vacate</Text></View>
        <View style={S.row}><Text style={S.label}>Tenant Notice:</Text>     <Text style={S.value}>{tenantNoticeDays} days written notice to vacate</Text></View>
        <View style={S.row}><Text style={S.label}>Monthly Rent:</Text>      <Text style={S.value}>${fmt(monthlyRent)} per month</Text></View>
        <View style={S.row}><Text style={S.label}>Rent Due:</Text>          <Text style={S.value}>Day {rentDueDay} of each month</Text></View>
        <View style={S.row}><Text style={S.label}>Late Fee:</Text>          <Text style={S.value}>${lateFee} if not received by the 5th of the month</Text></View>

        {/* Security Deposit */}
        <Text style={S.sectionTitle}>Security Deposit</Text>
        <View style={S.row}><Text style={S.label}>Deposit Amount:</Text>    <Text style={S.value}>${fmt(securityDeposit)} (due prior to move-in)</Text></View>
        <View style={S.row}><Text style={S.label}>Return Deadline:</Text>   <Text style={S.value}>Within {returnDays} days of move-out per {state} law</Text></View>
        <Text style={[S.paragraph, { marginTop: 4, color: '#374151', fontSize: 9.5 }]}>
          The security deposit may be applied toward: (a) unpaid rent; (b) cleaning costs exceeding normal wear and tear;
          (c) damages beyond normal wear and tear; (d) other lawful charges. Landlord shall provide a written itemized
          statement of deductions within {returnDays} days of Tenant vacating.
        </Text>

        {/* Move-In Costs */}
        <Text style={S.sectionTitle}>Move-In Cost Summary</Text>
        <View style={S.costTable}>
          {moveIn.lines.map((line, i) => (
            <View key={i} style={[S.costRow, i % 2 !== 0 && S.costRowAlt]}>
              <Text style={S.costLabel}>{line.label}</Text>
              <Text style={S.costAmount}>${fmt(line.amount)}</Text>
            </View>
          ))}
          <View style={S.costTotalRow}>
            <Text style={S.costTotalLbl}>Total Due at Signing</Text>
            <Text style={S.costTotalAmt}>${fmt(moveIn.total)}</Text>
          </View>
        </View>
        {moveIn.proration && (
          <Text style={[S.clauseText, { marginTop: 4 }]}>
            Pro-ration: {moveIn.proration.label} = ${fmt(moveIn.proration.dailyRate)}/day × {moveIn.proration.days} days.
          </Text>
        )}

        {/* Utilities & Pets */}
        <Text style={S.sectionTitle}>{isCommercial ? 'Utilities' : 'Utilities & Pets'}</Text>
        <View style={S.row}><Text style={S.label}>Utilities Included:</Text><Text style={S.value}>{utilitiesText}</Text></View>
        {!isCommercial && petPolicy && (
          <View style={S.row}><Text style={S.label}>Pet Policy:</Text><Text style={S.value}>{petPolicy}</Text></View>
        )}
        {!isCommercial && petDeposit && (
          <View style={S.row}><Text style={S.label}>Pet Deposit:</Text><Text style={S.value}>${petDeposit}</Text></View>
        )}

        {/* House / Operating Rules */}
        {houseRules && (
          <>
            <Text style={S.sectionTitle}>{isCommercial ? 'Operating Rules & Additional Terms' : 'House Rules & Additional Terms'}</Text>
            <Text style={S.paragraph}>{houseRules}</Text>
          </>
        )}

        {/* State Disclosures */}
        {stateData?.disclosures?.length > 0 && (
          <View style={S.discBox}>
            <Text style={S.discTitle}>{stateName} — Required Disclosures</Text>
            {stateData.disclosures.map((d, i) => <Text key={i} style={S.discItem}>• {d}</Text>)}
          </View>
        )}

        <Text style={S.footer}>
          Page 1 of 2 — Generated by {APP_NAME} on {today}. See Page 2 for Standard Terms and Signatures.
          For informational purposes only. Consult a licensed attorney before execution.
        </Text>
      </Page>

      {/* ─── PAGE 2: STANDARD TERMS + SIGNATURES ─── */}
      <Page size="LETTER" style={S.page2}>

        <View style={S.header}>
          <Text style={[S.title, { fontSize: 13 }]}>STANDARD TERMS AND CONDITIONS</Text>
          <Text style={S.subtitle}>Incorporated by reference into the {leaseTitle} on Page 1.</Text>
        </View>

        <Clause num="1" title="Security Deposit Terms"
          text={`The security deposit of $${fmt(securityDeposit)} is held as security for all obligations under this Agreement. Landlord shall return the deposit within ${returnDays} days of move-out with a written itemized statement of any deductions. Permitted deductions include unpaid rent, cleaning beyond normal wear and tear, damages, and other lawful charges under ${state} law. Tenant must provide a forwarding address to receive the deposit refund.`}
        />

        <Clause num="2" title="Right of Entry and Inspection"
          text={`Landlord shall provide at least ${enterNotice} advance notice before entering the property for non-emergency purposes. In emergencies threatening life or property, Landlord may enter immediately. Landlord shall respect Tenant's right to privacy at all times.`}
        />

        <Clause num="3" title="Maintenance and Repairs"
          text={`Landlord shall maintain the premises in a habitable condition as required by ${state} law, including heating, plumbing, and structural safety. Tenant shall keep the property clean, dispose of garbage properly, promptly notify Landlord of needed repairs, and not make alterations without prior written consent.`}
        />

        <Clause num="4" title="Quiet Enjoyment"
          text={`Landlord covenants that Tenant shall have quiet enjoyment and peaceful possession of the property throughout the lease term, provided Tenant complies with all terms herein.`}
        />

        {vacateClause && (
          <Clause num="5" title="Notice to Vacate" text={vacateClause.text} />
        )}

        {isCommercial ? (
          <Clause num="6" title="Permitted Use"
            text={`Tenant shall use the premises solely for the permitted use stated herein${permittedUse ? ` (${permittedUse})` : ''} and for no other purpose without Landlord's prior written consent. Tenant shall comply with all applicable zoning laws, business licenses, permits, and regulations. Tenant shall not use the premises for any illegal or hazardous activity.`}
          />
        ) : (
          <Clause num="6" title="Tenant Responsibilities"
            text={`Tenant agrees to: (a) pay rent on time; (b) maintain cleanliness; (c) refrain from illegal activities; (d) not disturb other occupants or neighbors; (e) comply with all applicable laws; (f) not sublet without written landlord approval; (g) report pest infestations, water damage, or structural concerns promptly.`}
          />
        )}

        <Clause num="7" title="Default and Remedies"
          text={`Failure by Tenant to pay rent when due, or material violation of any term of this Agreement, constitutes a default. Landlord shall provide written notice as required by ${state} law before pursuing remedies including eviction. Tenant shall have the right to cure certain defaults within the statutory cure period.`}
        />

        <Clause num="8" title="Abandonment"
          text={`If Tenant vacates before the lease term ends without written notice, Tenant may be liable for remaining rent as permitted under ${state} law. Landlord shall make reasonable efforts to re-rent the premises to mitigate damages.`}
        />

        <Clause num="9" title="Indemnification"
          text={`Tenant shall indemnify and hold Landlord harmless from claims, damages, or expenses arising from Tenant's negligent or intentional acts or omissions. This does not apply to claims arising from Landlord's own negligence or willful misconduct.`}
        />

        <Clause num="10" title="Notices"
          text={`All notices shall be in writing and delivered by personal delivery, certified mail, or email with confirmation to the addresses listed on Page 1. Notice is effective upon delivery or three (3) business days after mailing.`}
        />

        <Clause num="11" title="Governing Law and Jurisdiction"
          text={`This Agreement is governed by the laws of ${state}. Disputes shall be resolved in the appropriate courts of ${state}. The prevailing party may recover reasonable attorney fees to the extent permitted by law.`}
        />

        <Clause num="12" title="Severability"
          text={`If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.`}
        />

        <Clause num="13" title="Entire Agreement"
          text={`This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations. Any modification must be in writing and signed by both parties. Verbal agreements are not binding.`}
        />

        {/* Signatures */}
        <View style={S.sigSection}>
          <Text style={S.sectionTitle}>Signatures</Text>
          <Text style={[S.clauseText, { marginBottom: 8 }]}>
            By signing below, both parties acknowledge they have read, understood, and agreed to all terms set forth in
            this {leaseTitle} including all Standard Terms on this page.
          </Text>

          <View style={S.sigGrid}>
            <View style={S.sigBlock}>
              <View style={S.sigLine} />
              <Text style={S.sigLabel}>Landlord Signature</Text>
              <Text style={S.sigName}>{landlordName}</Text>
              <View style={S.dateLine} />
              <Text style={S.sigLabel}>Date</Text>
            </View>
            <View style={S.sigBlock}>
              <View style={S.sigLine} />
              <Text style={S.sigLabel}>{tenantLabel} Signature</Text>
              <Text style={S.sigName}>{businessName ? `${businessName} — ${tenantName}` : tenantName}</Text>
              <View style={S.dateLine} />
              <Text style={S.sigLabel}>Date</Text>
            </View>
          </View>

          {(landlordPrintedName && landlordSignedAt) || (tenantPrintedName && tenantSignedAt) ? (
            <View style={S.eSigBox}>
              <Text style={S.eSigTitle}>Electronic Signature Record</Text>
              {landlordPrintedName && landlordSignedAt && (
                <>
                  <Text style={S.eSigText}>Landlord signed as: {landlordPrintedName}</Text>
                  <Text style={S.eSigText}>Date & Time: {new Date(landlordSignedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</Text>
                </>
              )}
              {tenantPrintedName && tenantSignedAt && (
                <>
                  <Text style={S.eSigText}>Tenant signed as: {tenantPrintedName}</Text>
                  <Text style={S.eSigText}>Date & Time: {new Date(tenantSignedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</Text>
                </>
              )}
              <Text style={[S.eSigText, { marginTop: 2, fontSize: 8.5 }]}>
                These electronic signatures are legally binding under applicable e-signature law.
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={S.footer}>
          Page 2 of 2 — Generated by {APP_NAME} on {today}.
          For informational purposes only. Consult a licensed attorney before execution.
        </Text>
      </Page>
    </Document>
  )
}
