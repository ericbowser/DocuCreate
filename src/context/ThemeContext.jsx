import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Safe default so useTheme() never returns undefined
const ThemeContext = createContext({ isDark: false, toggle: () => {} })

export function ThemeProvider({ children }) {
  // Start with false — actual value is read in useEffect (client-side only)
  const [isDark, setIsDark] = useState(false)

  // Read preference on mount, THEN apply class — avoids race between
  // lazy initializer and the useEffect that writes to the DOM
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark')  { setIsDark(true);  return }
    if (stored === 'light') { setIsDark(false); return }
    // No stored preference — fall back to OS preference
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
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
