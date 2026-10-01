import type { DateKey } from '../types'
import { addDays, weekStartKey } from './dates.ts'

// The streak: weeks in a row with enough finished workouts (cardio sessions count too). Days off do not break it, because
// nobody trains every day. Pure, so it is tested in Node.

/** The owner's pick: a Monday to Sunday week counts when it has at least this many finished workouts. */
export const STREAK_MIN = 3

export interface Streak {
  /** Weeks in a row that reached STREAK_MIN. The week that is still running counts once it gets there. */
  weeks: number
  /** Finished workouts so far this week. */
  thisWeek: number
}

/**
 * A week that is still running never breaks the streak: with 1 workout so far on a Wednesday the
 * streak is still last week's. It breaks only when a finished week fell short.
 */
export function weeklyStreak(sessions: readonly { date: DateKey }[], today: DateKey): Streak {
  const perWeek = new Map<DateKey, number>()
  for (const s of sessions) {
    const week = weekStartKey(s.date)
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
  }
  const count = (week: DateKey) => perWeek.get(week) ?? 0

  let week = weekStartKey(today)
  const thisWeek = count(week)
  let weeks = thisWeek >= STREAK_MIN ? 1 : 0
  week = addDays(week, -7)
  while (count(week) >= STREAK_MIN) {
    weeks++
    week = addDays(week, -7)
  }
  return { weeks, thisWeek }
}
