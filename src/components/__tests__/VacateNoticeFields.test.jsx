import { screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { render } from '@testing-library/react'
import VacateNoticeFields from '../VacateNoticeFields'

function VacateHarness({ leaseType = 'Month-to-Month' }) {
  const {
    register,
    formState: { errors },
  } = useForm()
  const inputClass = () => 'input-field'
  return (
    <VacateNoticeFields
      stateCode="CA"
      stateName="California"
      leaseType={leaseType}
      register={register}
      errors={errors}
      inputClass={inputClass}
      warnings={['Custom warning']}
    />
  )
}

describe('VacateNoticeFields', () => {
  it('shows California statutory minimums', () => {
    render(<VacateHarness />)
    expect(screen.getByText(/California — Notice to vacate/i)).toBeInTheDocument()
    expect(screen.getByText(/Statutory minimums/i)).toBeInTheDocument()
  })

  it('renders landlord and tenant notice inputs', () => {
    render(<VacateHarness />)
    expect(screen.getByText('Landlord notice to vacate (days)')).toBeInTheDocument()
    expect(screen.getByText('Tenant notice to vacate (days)')).toBeInTheDocument()
  })

  it('shows warnings when provided', () => {
    render(<VacateHarness />)
    expect(screen.getByText('Custom warning')).toBeInTheDocument()
  })
})
