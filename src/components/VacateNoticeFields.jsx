import { getVacateRules } from '../utils/stateLawService'

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-body">{label}</label>
      {hint && <p className="text-xs text-subtle -mt-0.5">{hint}</p>}
      {children}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error.message}</span>}
    </div>
  )
}

export default function VacateNoticeFields({
  stateCode,
  stateName,
  leaseType,
  register,
  errors,
  inputClass,
  warnings = [],
}) {
  const rules = stateCode ? getVacateRules(stateCode) : null
  const isMonthly = leaseType === 'Month-to-Month'

  const minRule = (min) => ({
    required: isMonthly ? 'Required' : false,
    min: min ? { value: min, message: `Minimum ${min} days in ${stateName ?? 'this state'}` } : undefined,
    valueAsNumber: true,
  })

  return (
    <div className="space-y-4">
      {rules && (
        <div className="info-panel space-y-2">
          <p className="text-xs font-bold text-blue-800 dark:text-white uppercase tracking-widest">
            {stateName} — Notice to vacate (reference)
          </p>
          <p className="text-sm text-body">
            Statutory minimums: Landlord <strong className="text-heading">{rules.landlordMinDays} days</strong>
            {' · '}Tenant <strong className="text-heading">{rules.tenantMinDays} days</strong>
          </p>
          {rules.note && <p className="text-xs text-subtle leading-relaxed">{rules.note}</p>}
          <p className="text-xs text-subtle">Reference only — not legal advice. Local rules may require more notice.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Landlord notice to vacate (days)"
          hint={isMonthly ? 'Written notice landlord gives to end tenancy' : 'Written notice if landlord will not renew at term end'}
          error={errors.landlordNoticeDays}
        >
          <input
            type="number"
            min={rules?.landlordMinDays ?? 1}
            max={365}
            step={1}
            {...register('landlordNoticeDays', minRule(rules?.landlordMinDays))}
            className={inputClass(errors.landlordNoticeDays)}
            placeholder={String(rules?.landlordMinDays ?? 30)}
          />
        </Field>
        <Field
          label="Tenant notice to vacate (days)"
          hint={isMonthly ? 'Written notice tenant gives before moving out' : 'Written notice tenant gives if leaving at term end'}
          error={errors.tenantNoticeDays}
        >
          <input
            type="number"
            min={rules?.tenantMinDays ?? 1}
            max={365}
            step={1}
            {...register('tenantNoticeDays', minRule(rules?.tenantMinDays))}
            className={inputClass(errors.tenantNoticeDays)}
            placeholder={String(rules?.tenantMinDays ?? 30)}
          />
        </Field>
      </div>

      {warnings.length > 0 && (
        <div className="warn-panel text-xs space-y-1">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}
    </div>
  )
}
