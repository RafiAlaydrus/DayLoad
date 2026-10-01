import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_SETTINGS, PROFILE_ID, SETTINGS_ID, sortBySeedOrder, sortEquipmentBySeedOrder } from '../db/seed'
import { addDays, weekStartKey, todayKey } from '../lib/dates'
import type { History } from '../lib/progress'
import type { BodyLog, Equipment, Exercise, Goal, Gym, Profile, Session, Settings, TimetableDay, WorkoutSet } from '../types'

// useLiveQuery returns undefined while loading and re-renders on every change to the
// tables it read. It also throws query errors, which the route ErrorBoundary catches.
// So "no data" must be null or [], never undefined, or it can't be told from "loading".

export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS, [])
}

/** null means no profile yet (show onboarding). */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => (await db.profile.get(PROFILE_ID)) ?? null, [])
}

/**
 * True on a brand-new install: no profile yet and the intro was never finished or skipped.
 * Anyone who already has a profile (an existing phone, a restored backup) never sees it.
 * undefined while loading.
 */
export function useNeedsIntro(): boolean | undefined {
  return useLiveQuery(async () => {
    const [settings, profile] = await Promise.all([db.settings.get(SETTINGS_ID), db.profile.get(PROFILE_ID)])
    return profile === undefined && settings?.introDone !== true
  }, [])
}

/** Oldest first. The latest entry is the last one. */
export function useBodyLogs(): BodyLog[] | undefined {
  return useLiveQuery(() => db.bodyLogs.orderBy('date').toArray(), [])
}

/** In seed order (see sortBySeedOrder). */
export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(async () => sortBySeedOrder(await db.exercises.toArray()), [])
}

/** In the owner's order and groups (see sortEquipmentBySeedOrder). */
export function useEquipment(): Equipment[] | undefined {
  return useLiveQuery(async () => sortEquipmentBySeedOrder(await db.equipment.toArray()), [])
}

/** The gym of the most recent session, so Hit the gym can preselect it. */
export function useLastGymId(): string | null | undefined {
  return useLiveQuery(async () => (await db.sessions.orderBy('date').last())?.gymId ?? null, [])
}

/** Saved gyms by name, with the built-in "No equipment" last. One-time gyms are included; callers filter `isTemporary`. */
export function useGyms(): Gym[] | undefined {
  return useLiveQuery(async () => {
    const gyms = await db.gyms.toArray()
    return gyms.sort((a, b) => Number(a.isBuiltIn) - Number(b.isBuiltIn) || a.name.localeCompare(b.name))
  }, [])
}

/** The workout in progress. null means none. */
export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(async () => (await db.sessions.filter((s) => s.finishedAt === undefined).first()) ?? null, [])
}

/** null means there is no session with that id. */
export function useSession(id: number): Session | null | undefined {
  return useLiveQuery(async () => (await db.sessions.get(id)) ?? null, [id])
}

export function useSessionSets(sessionId: number | undefined): WorkoutSet[] | undefined {
  return useLiveQuery(
    async () => (sessionId === undefined ? [] : db.sets.where('sessionId').equals(sessionId).sortBy('id')),
    [sessionId],
  )
}

/** Finished sessions from Monday to Sunday of the current week. */
export function useWeekSessions(): Session[] | undefined {
  return useLiveQuery(() => {
    const monday = weekStartKey(todayKey())
    return db.sessions
      .where('date')
      .between(monday, addDays(monday, 7), true, false)
      .filter((s) => s.finishedAt !== undefined)
      .toArray()
  }, [])
}

/** Every finished workout, for adaptive mode. */
export function useFinishedSessions(): Session[] | undefined {
  return useLiveQuery(() => db.sessions.filter((s) => s.finishedAt !== undefined).toArray(), [])
}

/** Finished workouts and all their sets: what overload targets and personal records are worked out from. */
export function useHistory(): History | undefined {
  return useLiveQuery(async () => {
    const sessions = await db.sessions.filter((s) => s.finishedAt !== undefined).toArray()
    const sets = await db.sets.where('sessionId').anyOf(sessions.map((s) => s.id!)).toArray()
    return { sessions, sets }
  }, [])
}

export function useFinishedSessionCount(): number | undefined {
  return useLiveQuery(() => db.sessions.filter((s) => s.finishedAt !== undefined).count(), [])
}

/** Every row of the weekly timetable. A weekday with no row was never set. */
export function useTimetable(): TimetableDay[] | undefined {
  return useLiveQuery(() => db.timetable.toArray(), [])
}

export function useGoals(): Goal[] | undefined {
  return useLiveQuery(() => db.goals.toArray(), [])
}

/** Finished workouts from `from` to `to` (both included), for the calendar. */
export function useSessionsBetween(from: string, to: string): Session[] | undefined {
  return useLiveQuery(
    () =>
      db.sessions
        .where('date')
        .between(from, to, true, true)
        .filter((s) => s.finishedAt !== undefined)
        .toArray(),
    [from, to],
  )
}

/** Today's row of the weekly timetable, or null. */
export function useTimetableToday(): TimetableDay | null | undefined {
  return useLiveQuery(async () => (await db.timetable.get(new Date().getDay())) ?? null, [])
}
