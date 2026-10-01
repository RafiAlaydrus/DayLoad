import type { CardioGoal, CardioKind, CardioPlan, TimetableDay } from '../types'
import { groupsOf } from './recommend.ts'

// Cardio: the kinds, how a goal reads, and how far along a session is. Pure, so it is tested in Node.

export const CARDIO_KINDS: readonly { id: CardioKind; label: string; steps: boolean }[] = [
  { id: 'treadmill', label: 'Treadmill', steps: true },
  { id: 'walk', label: 'Walk', steps: true },
  { id: 'run', label: 'Run', steps: true },
  { id: 'cycling', label: 'Cycling', steps: false },
  { id: 'rowing', label: 'Rowing', steps: false },
  { id: 'elliptical', label: 'Elliptical', steps: false },
  { id: 'stairs', label: 'Stairs', steps: false },
]
export const CARDIO_KIND_IDS = CARDIO_KINDS.map((k) => k.id)

export const cardioLabel = (kind: CardioKind) => CARDIO_KINDS.find((k) => k.id === kind)?.label ?? kind
/** A step goal only makes sense when you are on your feet. */
export const allowsSteps = (kind: CardioKind) => CARDIO_KINDS.find((k) => k.id === kind)?.steps ?? false

/** What a picker holds while it is being filled in: a kind and a goal, the goal's number still as typed. */
export interface CardioDraft {
  kind: CardioKind
  type: CardioGoal['type']
  text: string
}

export const defaultCardioDraft = (kind: CardioKind = 'treadmill'): CardioDraft => ({ kind, type: 'minutes', text: '30' })

/** Quick picks for a goal, shown as chips above the number field. */
export const GOAL_PRESETS = { minutes: [20, 30, 45, 60], steps: [5000, 8000, 10000] } as const

const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/** "30 min" or "8,000 steps". */
export const goalText = (goal: CardioGoal) => (goal.type === 'minutes' ? `${goal.value} min` : `${thousands(goal.value)} steps`)

/** "Treadmill 30 min". */
export const cardioText = (plan: CardioPlan) => `${cardioLabel(plan.kind)} ${goalText(plan.goal)}`

/** A timetable day with no muscle group and no cardio is a rest day. */
export const isRestDay = (day: TimetableDay) => groupsOf(day).length === 0 && !day.cardio

/** How far along, 0 to 1, toward a goal. No goal means 0, so the bar stays empty. */
export function goalProgress(goal: CardioGoal | undefined, minutes: number, steps?: number): number {
  if (!goal || goal.value <= 0) return 0
  const done = goal.type === 'minutes' ? minutes : (steps ?? 0)
  return Math.min(1, Math.max(0, done / goal.value))
}

/** Whole minutes for a session that ran from `startedAt` to `now`: never 0, so a quick one still counts. */
export const minutesBetween = (startedAt: number, now: number) => Math.max(1, Math.round((now - startedAt) / 60000))
