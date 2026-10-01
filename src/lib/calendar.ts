import type { DateKey, TimetableDay } from '../types'
import { addDays, parseDateKey, toDateKey } from './dates.ts'

// The month grid of the Plan tab, and which timetable row applies to a day. Pure, so it is tested in Node.

/** The first day of the month containing `key`, moved by `months` ("2026-09-15" and 1 give "2026-10-01"). */
export function addMonths(key: DateKey, months: number): DateKey {
  const d = parseDateKey(key)
  return toDateKey(new Date(d.getFullYear(), d.getMonth() + months, 1))
}

/** A month as weeks, Monday to Sunday. Days that belong to the month before or after are null. */
export function monthWeeks(firstOfMonth: DateKey): (DateKey | null)[][] {
  const first = parseDateKey(firstOfMonth)
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday = 0
  const cells: (DateKey | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => addDays(firstOfMonth, i)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}

/** The timetable row for the weekday of `key`. Undefined means the day was never set. */
export const plannedFor = (key: DateKey, rows: readonly TimetableDay[]) =>
  rows.find((row) => row.dayOfWeek === parseDateKey(key).getDay())

/** Monday first, as Date#getDay() numbers: the order the timetable and the calendar list the days. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
