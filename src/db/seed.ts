import type { Transaction } from 'dexie'
import equipment from '../data/equipment.json'
import exercises from '../data/exercises.json'
import type { Equipment, Exercise, Gym, Settings } from '../types'

export const SETTINGS_ID = 1
export const PROFILE_ID = 1
export const NO_EQUIPMENT_GYM_ID = 'no-equipment'

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  workoutMode: 'timetable',
  avoidIds: [],
  favoriteIds: [],
  weightUnit: 'kg',
  lengthUnit: 'cm',
}

const NO_EQUIPMENT_GYM: Gym = {
  id: NO_EQUIPMENT_GYM_ID,
  name: 'No equipment',
  equipmentIds: [],
  isTemporary: false,
  isBuiltIn: true,
}

/** Dexie "populate" handler: fills a brand-new database with the built-in data. */
export async function seed(tx: Transaction) {
  await tx.table('equipment').bulkAdd(equipment satisfies Equipment[])
  await tx.table('exercises').bulkAdd((exercises as Omit<Exercise, 'isCustom'>[]).map((e) => ({ ...e, isCustom: false })))
  await tx.table('gyms').add(NO_EQUIPMENT_GYM)
  await tx.table('settings').add(DEFAULT_SETTINGS)
}
