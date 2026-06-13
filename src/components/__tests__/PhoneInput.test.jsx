import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import PhoneInput from '../PhoneInput'
import { render } from '@testing-library/react'

function PhoneInputHarness({ defaultPhone = '' }) {
  const { register, setValue, watch } = useForm({ defaultValues: { phone: defaultPhone } })
  return (
    <PhoneInput
      register={register}
      setValue={setValue}
      watch={watch}
      name="phone"
      className="input-field"
    />
  )
}

describe('PhoneInput', () => {
  it('shows +1 prefix', () => {
    render(<PhoneInputHarness />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('formats digits as user types', async () => {
    const user = userEvent.setup()
    render(<PhoneInputHarness />)
    const input = screen.getByRole('textbox')
    await user.type(input, '8015551234')
    expect(input).toHaveValue('(801) 555-1234')
  })

  it('displays national format from stored +1 value', () => {
    render(<PhoneInputHarness defaultPhone="+1 (801) 555-1234" />)
    expect(screen.getByRole('textbox')).toHaveValue('(801) 555-1234')
  })
})
