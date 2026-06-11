import { useTheme } from '../context/ThemeContext'
import { HiFire, HiOutlineMoon } from '../icons'

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-pill"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to Ember Night mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to Ember Night mode'}
    >
      <span className={`theme-pill-thumb ${isDark ? 'active' : ''}`}>
        {isDark
          ? <HiFire className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          : <HiOutlineMoon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />}
      </span>
    </button>
  )
}
