import type { Session, WeightUnit, WorkoutSet } from '../types'
import { fromKg, loadText, toKg } from './units.ts'

// Progressive overload and personal records, worked out from finished workouts.
// Pure functions over plain data, so they are tested in Node.

/** Finished sessions and their sets. A workout in progress is not history. */
export interface History {
  sessions: Session[]
  sets: WorkoutSet[]
}

/** A set's result. Bodyweight sets have weight 0, so the same ordering ranks them by reps. */
export interface Best {
  weightKg: number
  reps: number
}

/** The owner's overload rule: when every set last time reached this many reps, add weight. */
export const OVERLOAD_REPS = 8
/** How much weight to add, in the unit the user lifts in (2.5 kg, or 5 lb). */
export const STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 }

/** A result beats another when it is heavier, or the same weight for more reps. This is also the personal record rule. */
export const beats = (a: Best, b: Best) => a.weightKg > b.weightKg || (a.weightKg === b.weightKg && a.reps > b.reps)

export const bestOf = <T extends Best>(sets: readonly T[]): T | undefined =>
  sets.reduce<T | undefined>((best, s) => (best === undefined || beats(s, best) ? s : best), undefined)

/** "62.5 kg × 8", or "Bodyweight × 10" when no weight was used. */
export const bestText = (best: Best, unit: WeightUnit) =>
  best.weightKg > 0 ? `${loadText(best.weightKg, unit)} ${unit} × ${best.reps}` : `Bodyweight × ${best.reps}`

const startedAt = (history: History) => new Map(history.sessions.map((s) => [s.id, s.startedAt]))

/** The sets of one exercise from the most recent finished session that included it, in set order. */
export function lastSets(history: History, exerciseId: string): WorkoutSet[] {
  const when = startedAt(history)
  const mine = history.sets.filter((s) => s.exerciseId === exerciseId)
  const latest = Math.max(-1, ...mine.map((s) => when.get(s.sessionId) ?? -1))
  return mine.filter((s) => when.get(s.sessionId) === latest).sort((a, b) => a.order - b.order)
}

export interface Target extends Best {
  /** What was done last time: the heaviest set, and the most reps at that weight. */
  last: Best
  /** True when the target asks for more than last time. */
  progressed: boolean
}

/**
 * What to aim for today, from last time's sets (null when there is no history).
 *  - Every set reached OVERLOAD_REPS: same lift, one step heavier.
 *  - Otherwise: the same weight again, aiming for OVERLOAD_REPS on every set.
 *  - Bodyweight: one more rep than the best set.
 */
export function overloadTarget(last: readonly WorkoutSet[], unit: WeightUnit): Target | null {
  const top = bestOf(last)
  if (!top) return null
  const lastBest = { weightKg: top.weightKg, reps: top.reps }
  if (top.weightKg === 0) return { weightKg: 0, reps: top.reps + 1, last: lastBest, progressed: true }
  if (!last.every((s) => s.reps >= OVERLOAD_REPS)) {
    return { weightKg: top.weightKg, reps: OVERLOAD_REPS, last: lastBest, progressed: false }
  }
  // Step in the user's unit, so a lb lifter gets 135 -> 140 lb, not 135 -> 137.5 lb.
  const shown = Math.round(fromKg(top.weightKg, unit) * 10) / 10
  return { weightKg: toKg(shown + STEP[unit], unit), reps: OVERLOAD_REPS, last: lastBest, progressed: true }
}

/** The sentence shown on the Target row of the workout screen. */
export function targetText(target: Target, unit: WeightUnit): string {
  const last = `Last time ${target.last.weightKg > 0 ? bestText(target.last, unit) : `${target.last.reps} reps`}.`
  if (target.weightKg === 0) return `${last} Try ${target.reps} today.`
  const weight = `${loadText(target.weightKg, unit)} ${unit}`
  return target.progressed
    ? `${last} Try ${weight} today.`
    : `${last} Repeat ${weight} and aim for ${target.reps} on every set.`
}

export interface PersonalRecord extends Best {
  exerciseId: string
  /** The day the record was set. */
  date: string
}

/** The best set ever for each exercise, most recently set first. Ties keep the earlier set. */
export function personalRecords(history: History): PersonalRecord[] {
  const session = new Map(history.sessions.map((s) => [s.id, s]))
  const inOrder = history.sets
    .filter((s) => session.has(s.sessionId))
    .sort((a, b) => session.get(a.sessionId)!.startedAt - session.get(b.sessionId)!.startedAt || a.id! - b.id!)
  const best = new Map<string, WorkoutSet>()
  for (const s of inOrder) {
    const current = best.get(s.exerciseId)
    if (current === undefined || beats(s, current)) best.set(s.exerciseId, s)
  }
  return [...best.values()]
    .map((s) => ({ exerciseId: s.exerciseId, weightKg: s.weightKg, reps: s.reps, date: session.get(s.sessionId)!.date }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export interface NewRecord {
  exerciseId: string
  now: Best
  /** The record it beat. */
  before: Best
}

/**
 * Records this session set: exercises where its best set beats everything done in earlier sessions.
 * The first time an exercise is ever logged has nothing to beat, so it is a starting point, not a record.
 */
export function newRecords(history: History, session: Session): NewRecord[] {
  const when = startedAt(history)
  const mine = history.sets.filter((s) => s.sessionId === session.id)
  const earlier = history.sets.filter((s) => s.sessionId !== session.id && (when.get(s.sessionId) ?? Infinity) < session.startedAt)
  const records: NewRecord[] = []
  for (const exerciseId of new Set(mine.map((s) => s.exerciseId))) {
    const now = bestOf(mine.filter((s) => s.exerciseId === exerciseId))
    const before = bestOf(earlier.filter((s) => s.exerciseId === exerciseId))
    if (now && before && beats(now, before)) {
      records.push({ exerciseId, now: { weightKg: now.weightKg, reps: now.reps }, before: { weightKg: before.weightKg, reps: before.reps } })
    }
  }
  return records
}
