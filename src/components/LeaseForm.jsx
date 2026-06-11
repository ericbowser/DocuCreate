import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

const UTILITIES = ['Water', 'Electric', 'Gas', 'Internet', 'Trash']

export default function LeaseForm() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()

  const onSubmit = (data) => {
    sessionStorage.setItem('leaseData', JSON.stringify(data))
    navigate('/preview')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="card-surface p-8 space-y-8"
    >

      {/* Landlord */}
      <section>
        <h2 className="text-base font-semibold text-heading border-b card-border pb-2 mb-4">
          Landlord Info
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Full Name" error={errors.landlordName}>
            <input {...register('landlordName', { required: 'Required' })}
              className={inputClass(errors.landlordName)}
              placeholder="John Smith" />
          </Field>
          <Field label="Address" error={errors.landlordAddress}>
            <input {...register('landlordAddress', { required: 'Required' })}
              className={inputClass(errors.landlordAddress)}
              placeholder="123 Main St, City, State, ZIP" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" error={errors.landlordPhone}>
              <input {...register('landlordPhone', { required: 'Required' })}
                className={inputClass(errors.landlordPhone)}
                placeholder="(801) 555-1234" />
            </Field>
            <Field label="Email" error={errors.landlordEmail}>
              <input type="email" {...register('landlordEmail', { required: 'Required' })}
                className={inputClass(errors.landlordEmail)}
                placeholder="landlord@email.com" />
            </Field>
          </div>
        </div>
      </section>

      {/* Tenant */}
      <section>
        <h2 className="text-base font-semibold text-heading border-b card-border pb-2 mb-4">
          Tenant Info
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Full Name" error={errors.tenantName}>
            <input {...register('tenantName', { required: 'Required' })}
              className={inputClass(errors.tenantName)}
              placeholder="Jane Doe" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" error={errors.tenantPhone}>
              <input {...register('tenantPhone', { required: 'Required' })}
                className={inputClass(errors.tenantPhone)}
                placeholder="(801) 555-5678" />
            </Field>
            <Field label="Email" error={errors.tenantEmail}>
              <input type="email" {...register('tenantEmail', { required: 'Required' })}
                className={inputClass(errors.tenantEmail)}
                placeholder="tenant@email.com" />
            </Field>
          </div>
        </div>
      </section>

      {/* Property */}
      <section>
        <h2 className="text-base font-semibold text-heading border-b card-border pb-2 mb-4">
          Property Details
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Property Address" error={errors.propertyAddress}>
            <input {...register('propertyAddress', { required: 'Required' })}
              className={inputClass(errors.propertyAddress)}
              placeholder="456 Rental Ave, City, State, ZIP" />
          </Field>
          <Field label="Room Description" error={errors.roomDescription}>
            <input {...register('roomDescription', { required: 'Required' })}
              className={inputClass(errors.roomDescription)}
              placeholder="e.g. Upstairs bedroom with private bath" />
          </Field>
        </div>
      </section>

      {/* Lease Terms */}
      <section>
        <h2 className="text-base font-semibold text-heading border-b card-border pb-2 mb-4">
          Lease Terms
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" error={errors.startDate}>
            <input type="date" {...register('startDate', { required: 'Required' })}
              className={inputClass(errors.startDate)} />
          </Field>
          <Field label="End Date" error={errors.endDate}>
            <input type="date" {...register('endDate', { required: 'Required' })}
              className={inputClass(errors.endDate)} />
          </Field>
          <Field label="Monthly Rent ($)" error={errors.monthlyRent}>
            <input type="number" {...register('monthlyRent', { required: 'Required', min: 1 })}
              className={inputClass(errors.monthlyRent)}
              placeholder="800" />
          </Field>
          <Field label="Security Deposit ($)" error={errors.securityDeposit}>
            <input type="number" {...register('securityDeposit', { required: 'Required', min: 0 })}
              className={inputClass(errors.securityDeposit)}
              placeholder="800" />
          </Field>
          <Field label="Rent Due Day of Month" error={errors.rentDueDay}>
            <input type="number" {...register('rentDueDay', { required: 'Required', min: 1, max: 28 })}
              className={inputClass(errors.rentDueDay)}
              placeholder="1" />
          </Field>
          <Field label="Late Fee ($)" error={errors.lateFee}>
            <input type="number" {...register('lateFee', { required: 'Required', min: 0 })}
              className={inputClass(errors.lateFee)}
              placeholder="50" />
          </Field>
        </div>
      </section>

      {/* Utilities */}
      <section>
        <h2 className="text-base font-semibold text-heading border-b card-border pb-2 mb-4">
          Utilities Included
        </h2>
        <div className="flex flex-wrap gap-5">
          {UTILITIES.map(u => (
            <label key={u} className="flex items-center gap-2 text-sm text-body cursor-pointer">
              <input type="checkbox" value={u} {...register('utilities')}
                className="w-4 h-4 accent-blue-600" />
              {u}
            </label>
          ))}
        </div>
      </section>

      {/* Pet Policy */}
      <section>
        <h2 className="text-base font-semibold text-heading border-b card-border pb-2 mb-4">
          Pet Policy
        </h2>
        <div className="flex gap-8">
          {['Allowed', 'Not Allowed', 'With Approval'].map(p => (
            <label key={p} className="flex items-center gap-2 text-sm text-body cursor-pointer">
              <input type="radio" value={p} {...register('petPolicy', { required: true })}
                className="w-4 h-4 accent-blue-600" />
              {p}
            </label>
          ))}
        </div>
      </section>

      {/* House Rules */}
      <section>
        <Field label="House Rules / Additional Terms" error={errors.houseRules}>
          <textarea
            {...register('houseRules')}
            rows={4}
            className="input-field resize-none"
            placeholder="e.g. No smoking. Quiet hours 10pm–7am. Common areas shared." />
        </Field>
      </section>

      <button
        type="submit"
        className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Preview Lease →
      </button>

    </form>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-body">{label}</label>
      {children}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error.message}</span>}
    </div>
  )
}

function inputClass(error) {
  return ['input-field', error ? 'input-field-error' : ''].filter(Boolean).join(' ')
}
