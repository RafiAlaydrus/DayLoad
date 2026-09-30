import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_SETTINGS, PROFILE_ID, SETTINGS_ID } from '../db/seed'
import type { BodyLog, Profile, Settings } from '../types'

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

/** Oldest first. The latest entry is the last one. */
export function useBodyLogs(): BodyLog[] | undefined {
  return useLiveQuery(() => db.bodyLogs.orderBy('date').toArray(), [])
}
