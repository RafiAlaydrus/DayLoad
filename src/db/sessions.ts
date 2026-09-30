import { todayKey } from '../lib/dates'
import type { MuscleGroup, Session, WorkoutSet } from '../types'
import { db } from './db'

// Everything a workout writes goes to the database the moment it happens, so if iOS closes the
// app mid-session, "Continue workout" resumes exactly where it was.

const unfinished = (s: Session) => s.finishedAt === undefined

interface StartInput {
  /** An existing gym, or a one-time location to create along with the session. */
  gym: { id: string } | { name: string; equipmentIds: string[] }
  muscleGroup: MuscleGroup
  plannedMin: number
  exerciseIds: string[]
  setsPerExercise: number
}

/** Creates the session (and the one-time gym, if any) together. Returns the existing session if one is already running. */
export function startSession(input: StartInput): Promise<number> {
  return db.transaction('rw', db.sessions, db.gyms, async () => {
    const running = await db.sessions.filter(unfinished).first()
    if (running?.id !== undefined) return running.id

    let gymId: string
    if ('id' in input.gym) {
      gymId = input.gym.id
    } else {
      gymId = crypto.randomUUID()
      await db.gyms.add({
        id: gymId,
        name: input.gym.name.trim() || 'One-time location',
        equipmentIds: input.gym.equipmentIds,
        isTemporary: true,
        isBuiltIn: false,
      })
    }
    return db.sessions.add({
      date: todayKey(),
      gymId,
      muscleGroup: input.muscleGroup,
      plannedMin: input.plannedMin,
      durationMin: 0,
      startedAt: Date.now(),
      exerciseIds: input.exerciseIds,
      currentIndex: 0,
      setsPerExercise: input.setsPerExercise,
    })
  })
}

/** Logs one set. A set that is already logged (a double tap) is left alone. */
export function logSet(set: Omit<WorkoutSet, 'id'>): Promise<void> {
  return db.transaction('rw', db.sets, async () => {
    const exists = await db.sets
      .where('sessionId')
      .equals(set.sessionId)
      .filter((s) => s.exerciseId === set.exerciseId && s.order === set.order)
      .count()
    if (!exists) await db.sets.add(set)
  })
}

export function unlogSet(sessionId: number, exerciseId: string, order: number): Promise<number> {
  return db.sets
    .where('sessionId')
    .equals(sessionId)
    .filter((s) => s.exerciseId === exerciseId && s.order === order)
    .delete()
}

export const goToExercise = (sessionId: number, currentIndex: number) => db.sessions.update(sessionId, { currentIndex })

export const swapExercise = (session: Session, index: number, exerciseId: string) =>
  db.sessions.update(session.id!, { exerciseIds: session.exerciseIds.map((id, i) => (i === index ? exerciseId : id)) })

export function finishSession(session: Session) {
  const now = Date.now()
  return db.sessions.update(session.id!, {
    finishedAt: now,
    durationMin: Math.max(1, Math.round((now - session.startedAt) / 60000)),
  })
}

/** Removes a session that never got a set, so an accidental start leaves nothing behind. Its one-time gym goes too. */
export function discardSession(session: Session): Promise<void> {
  return db.transaction('rw', db.sessions, db.sets, db.gyms, async () => {
    await db.sets.where('sessionId').equals(session.id!).delete()
    await db.sessions.delete(session.id!)
    const gym = await db.gyms.get(session.gymId)
    if (gym?.isTemporary && (await db.sessions.where('gymId').equals(gym.id).count()) === 0) await db.gyms.delete(gym.id)
  })
}
