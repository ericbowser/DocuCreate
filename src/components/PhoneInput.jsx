import { formatPhone, phoneNationalFromStored } from '../utils/phoneFormat'

export default function PhoneInput({
  register,
  setValue,
  watch,
  name,
  className,
  placeholder = '(801) 555-1234',
}) {
  const { onChange, onBlur, ref } = register(name)
  const national = phoneNationalFromStored(watch?.(name))

  return (
    <div className="flex items-stretch w-full">
      <span
        className="inline-flex items-center px-3 text-sm font-medium text-muted bg-slate-50 dark:bg-white/[0.06] border border-line dark:border-white/[0.12] border-r-0 rounded-l-xl shrink-0"
        aria-hidden="true"
      >
        +1
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={14}
        placeholder={placeholder}
        className={[className, 'rounded-l-none flex-1 min-w-0'].filter(Boolean).join(' ')}
        ref={ref}
        name={name}
        value={national}
        onBlur={onBlur}
        onChange={(e) => {
          const formatted = formatPhone(e.target.value)
          setValue(name, formatted, { shouldValidate: true, shouldDirty: true })
          onChange({ target: { name, value: formatted } })
        }}
      />
    </div>
  )
}
