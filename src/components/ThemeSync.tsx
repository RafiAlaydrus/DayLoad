import { useEffect } from 'react'
import { useSettings } from '../hooks/useData'
import { resolveTheme, THEME_STORAGE_KEY } from '../lib/theme'

/**
 * Puts the chosen theme on <html data-theme>, follows the phone while the choice is "system", and
 * mirrors the choice into localStorage so the next launch paints the right colours at once
 * (index.html reads it before anything renders). Renders nothing.
 */
export function ThemeSync() {
  const settings = useSettings()
  const loaded = settings !== undefined
  const pref = settings?.theme

  useEffect(() => {
    // Until the settings are read, keep what index.html chose for the first paint.
    if (!loaded) return
    const phone = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const theme = resolveTheme(pref, phone.matches)
      document.documentElement.dataset.theme = theme
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F3EFE7' : '#1B1A17')
      try {
        localStorage.setItem(THEME_STORAGE_KEY, pref ?? 'system')
      } catch {
        // Private browsing can refuse storage. The theme still applies; only the first paint next time is affected.
      }
    }
    apply()
    phone.addEventListener('change', apply)
    return () => phone.removeEventListener('change', apply)
  }, [loaded, pref])

  return null
}
