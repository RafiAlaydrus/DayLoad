import type { ThemePref } from '../types'

export type Theme = 'dark' | 'light'

/** The theme in use: a fixed choice, or the phone's setting when the choice is "system" (or was never made). */
export const resolveTheme = (pref: ThemePref | undefined, systemIsLight: boolean): Theme =>
  pref === 'dark' ? 'dark' : pref === 'light' ? 'light' : systemIsLight ? 'light' : 'dark'

/** Where the choice is mirrored so the very first paint can use it, before the database is open. */
export const THEME_STORAGE_KEY = 'dayload-theme'
