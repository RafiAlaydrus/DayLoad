import type { DateKey } from '../types'

// Dates are local calendar days ("YYYY-MM-DD"). toISOString() is UTC and would put an
// evening entry on tomorrow's date in some time zones, so it is never used here.

const pad = (n: number) => String(n).padStart(2, '0')

export const toDateKey = (d: Date): DateKey => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayKey = (): DateKey => toDateKey(new Date())

export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** True for a real calendar day in the "YYYY-MM-DD" shape (rejects 2026-02-31). */
export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(parseDateKey(value)) === value
}

/** "Wed, 30 Sep" (device language). Adds the year when it is not the current year. */
export function formatDate(key: DateKey, { weekday = false } = {}): string {
  const date = parseDateKey(key)
  return date.toLocaleDateString(undefined, {
    weekday: weekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}
