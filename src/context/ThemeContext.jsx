import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Safe default so useTheme() never returns undefined
const ThemeContext = createContext({ isDark: true, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true)

  // Read stored preference on mount; default is Ember Night (dark)
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark')  { setIsDark(true);  return }
    if (stored === 'light') { setIsDark(false); return }
    setIsDark(true)
  }, [])

  // Sync DOM class + localStorage whenever isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = useCallback(() => setIsDark(prev => !prev), [])

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
