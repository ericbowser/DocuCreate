import { STATES } from '../data/stateLaws'
import { ZIP_VALIDATE } from '../utils/addressFormat'

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-body">{label}</label>
      {children}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error.message}</span>}
    </div>
  )
}

/**
 * @param {'landlord' | 'property'} prefix — form field prefix
 */
export default function AddressFields({ prefix, register, errors, inputClass, streetAutoFocus = false }) {
  const street = `${prefix}Street`
  const city = `${prefix}City`
  const state = `${prefix}State`
  const zip = `${prefix}Zip`

  const streetLabel = prefix === 'property' ? 'Street Address' : 'Street Address'
  const heading = prefix === 'property' ? 'Property location' : 'Mailing address'

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-heading">{heading}</legend>
      <Field label={streetLabel} error={errors[street]}>
        <input
          {...register(street, { required: 'Required' })}
          className={inputClass(errors[street])}
          placeholder="123 Main St, Apt 4"
          autoFocus={streetAutoFocus}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
        <div className="sm:col-span-3">
          <Field label="City" error={errors[city]}>
            <input
              {...register(city, { required: 'Required' })}
              className={inputClass(errors[city])}
              placeholder="Salt Lake City"
            />
          </Field>
        </div>
        <div className="sm:col-span-1">
          <Field label="State" error={errors[state]}>
            <select {...register(state, { required: 'Required' })} className={inputClass(errors[state])}>
              <option value="">—</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="ZIP Code" error={errors[zip]}>
            <input
              {...register(zip, ZIP_VALIDATE)}
              className={inputClass(errors[zip])}
              placeholder="84101"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
        </div>
      </div>
    </fieldset>
  )
}
