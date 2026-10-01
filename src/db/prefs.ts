import { withPref, type Pref } from '../lib/recommend'
import { db } from './db'
import { DEFAULT_SETTINGS, SETTINGS_ID } from './seed'

/** Marks or unmarks an exercise as a favorite or one to avoid. Reads and writes in one transaction, so two quick taps cannot lose one. */
export function toggleExercisePref(exerciseId: string, pref: Pref): Promise<void> {
  return db.transaction('rw', db.settings, async () => {
    const settings = (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS
    await db.settings.put({ ...settings, ...withPref(settings, exerciseId, pref) })
  })
}
