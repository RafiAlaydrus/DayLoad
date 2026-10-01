import type { DateKey, MuscleGroup, Session } from '../types'
import { addDays } from './dates.ts'
import { groupsOf, MUSCLE_GROUPS } from './recommend.ts'

// Adaptive mode: choose the muscle group from what was actually trained, and suggest rest after
// too many training days in a row. Works from finished sessions only.

/** The owner's pick: after this many days in a row with a workout, suggest a rest day. */
export const REST_AFTER_DAYS = 3

/**
 * The muscle group trained longest ago, and the day it was last trained (null: never).
 * A group that was never trained comes first; ties go in MUSCLE_GROUPS order.
 */
export function longestAgo(sessions: readonly Session[]): { group: MuscleGroup; last: DateKey | null } {
  const last = new Map<MuscleGroup, DateKey>()
  for (const s of sessions) for (const g of groupsOf(s)) if ((last.get(g) ?? '') < s.date) last.set(g, s.date)
  // "YYYY-MM-DD" sorts in calendar order, and '' sorts before any date. The sort is stable.
  const day = (g: MuscleGroup) => last.get(g) ?? ''
  const [group] = [...MUSCLE_GROUPS].sort((a, b) => (day(a) < day(b) ? -1 : day(a) > day(b) ? 1 : 0))
  return { group, last: last.get(group) ?? null }
}

/** Days in a row with a finished workout, counting back from today (if trained today) or from yesterday. */
export function trainingStreak(sessions: readonly Session[], today: DateKey): number {
  const days = new Set(sessions.map((s) => s.date))
  let day = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(day)) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}
