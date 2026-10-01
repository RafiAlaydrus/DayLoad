import { minutesBetween } from '../lib/cardio'
import { todayKey } from '../lib/dates'
import type { CardioGoal, CardioKind, CardioSession } from '../types'
import { db } from './db'

// Like workouts, a cardio session is written the moment it starts, so if iOS closes the app
// mid-session the timer is still right when it opens again (it is worked out from startedAt).

const running = (c: CardioSession) => c.finishedAt === undefined

/** Starts a session. If one is already running, that one is returned instead. */
export function startCardio(kind: CardioKind, goal?: CardioGoal): Promise<number> {
  return db.transaction('rw', db.cardio, async () => {
    const existing = await db.cardio.filter(running).first()
    if (existing?.id !== undefined) return existing.id
    return db.cardio.add({ date: todayKey(), kind, ...(goal ? { goal } : {}), minutes: 0, startedAt: Date.now() })
  })
}

/** Ends a running session. Steps are optional. */
export function finishCardio(session: CardioSession, steps: number | null) {
  const now = Date.now()
  return db.cardio.update(session.id!, {
    finishedAt: now,
    minutes: minutesBetween(session.startedAt, now),
    ...(steps !== null ? { steps } : {}),
  })
}

/** For cardio done without the app's timer (a walk with the phone in a pocket): saved as already finished. */
export function logCardio(input: { kind: CardioKind; minutes: number; steps: number | null; goal?: CardioGoal }) {
  const now = Date.now()
  return db.cardio.add({
    date: todayKey(),
    kind: input.kind,
    ...(input.goal ? { goal: input.goal } : {}),
    startedAt: now - input.minutes * 60000,
    finishedAt: now,
    minutes: input.minutes,
    ...(input.steps !== null ? { steps: input.steps } : {}),
  })
}

export const discardCardio = (id: number) => db.cardio.delete(id)
