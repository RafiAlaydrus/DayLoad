import type { DateKey } from '../types'
import { addDays, parseDateKey, weekStartKey } from './dates.ts'

// The activity heatmap on Home: one square per day, a column per week, shaded by how many minutes
// you were active that day (lifting plus cardio). Pure, so it is tested in Node.

export const HEAT_WEEKS = 18

/** From 1 minute, from 40, from 60: light, medium, dark. Close to the 30, 45 and 60 minute sessions Hit the gym offers. */
export const HEAT_STEPS = [1, 40, 60] as const

export type HeatLevel = 0 | 1 | 2 | 3

/** 0 is a day with nothing; 1 to 3 get darker with more minutes. */
export const heatLevel = (minutes: number): HeatLevel => (minutes >= HEAT_STEPS[2] ? 3 : minutes >= HEAT_STEPS[1] ? 2 : minutes >= HEAT_STEPS[0] ? 1 : 0)

export interface HeatCell {
  date: DateKey
  minutes: number
  level: HeatLevel
  today: boolean
  /** A day after today in the week that is still running: drawn as a gap, not as an empty day. */
  future: boolean
}

/**
 * Active minutes per day from finished workouts and cardio. A session counts for at least one
 * minute, so a day with something logged is never left looking empty.
 */
export function activityByDay(
  sessions: readonly { date: DateKey; durationMin: number }[],
  cardio: readonly { date: DateKey; minutes: number }[],
): Map<DateKey, number> {
  const byDay = new Map<DateKey, number>()
  const add = (date: DateKey, minutes: number) => byDay.set(date, (byDay.get(date) ?? 0) + Math.max(1, minutes))
  for (const s of sessions) add(s.date, s.durationMin)
  for (const c of cardio) add(c.date, c.minutes)
  return byDay
}

/** The last `weeks` weeks as columns of seven days, Monday first, ending with the week that contains today. */
export function heatWeeks(byDay: ReadonlyMap<DateKey, number>, today: DateKey, weeks = HEAT_WEEKS): HeatCell[][] {
  const first = addDays(weekStartKey(today), -7 * (weeks - 1))
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d)
      const minutes = byDay.get(date) ?? 0
      return { date, minutes, level: heatLevel(minutes), today: date === today, future: date > today }
    }),
  )
}

/**
 * Where a month label goes: the column in which the month changes (0 to 11, as Date#getMonth gives it).
 * A column belongs to the month of its Monday.
 * A label that would crowd the next one is dropped, so the text never overlaps.
 */
export function monthStarts(columns: readonly HeatCell[][], minGap = 3): { col: number; month: number }[] {
  const starts: { col: number; month: number }[] = []
  let previous = -1
  columns.forEach((column, col) => {
    const month = parseDateKey(column[0].date).getMonth()
    if (month !== previous) starts.push({ col, month })
    previous = month
  })
  return starts.filter((s, i) => (i === starts.length - 1 ? true : starts[i + 1].col - s.col >= minGap))
}
