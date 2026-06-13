import { screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { render } from '@testing-library/react'
import AddressFields from '../AddressFields'

function AddressFieldsHarness({ prefix = 'landlord' }) {
  const {
    register,
    formState: { errors },
  } = useForm()
  const inputClass = () => 'input-field'
  return (
    <AddressFields
      prefix={prefix}
      register={register}
      errors={errors}
      inputClass={inputClass}
    />
  )
}

describe('AddressFields', () => {
  it('renders mailing address fields for landlord', () => {
    render(<AddressFieldsHarness prefix="landlord" />)
    expect(screen.getByText('Mailing address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('123 Main St, Apt 4')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Salt Lake City')).toBeInTheDocument()
    expect(screen.getByText('ZIP Code')).toBeInTheDocument()
  })

  it('renders property location legend for property prefix', () => {
    render(<AddressFieldsHarness prefix="property" />)
    expect(screen.getByText('Property location')).toBeInTheDocument()
  })

  it('includes state select options', () => {
    render(<AddressFieldsHarness />)
    expect(screen.getByRole('option', { name: 'UT' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'CA' })).toBeInTheDocument()
  })
})
