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
  theme: 'system',
}

const NO_EQUIPMENT_GYM: Gym = {
  id: NO_EQUIPMENT_GYM_ID,
  name: 'No equipment',
  equipmentIds: [],
  isTemporary: false,
  isBuiltIn: true,
}

/** The built-in lists, exactly as shipped. Also what a database upgrade refreshes old phones from. */
export const SEED_EQUIPMENT: Equipment[] = equipment
export const SEED_EXERCISES: Exercise[] = (exercises as Omit<Exercise, 'isCustom'>[]).map((e) => ({ ...e, isCustom: false }))

// IndexedDB hands rows back sorted by id (alphabetical), which throws away the deliberate order of
// the JSON files: heavy compound lifts first for exercises, and the owner's groups for equipment.
// Both the recommender and the checklists depend on that order, so restore it.
// Anything not in the seed (custom exercises, later) goes last.
const orderOf = (list: { id: string }[]) => new Map(list.map((e, i) => [e.id, i]))
const sortedBy = <T extends { id: string }>(order: Map<string, number>, list: T[]) =>
  [...list].sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity))

const EXERCISE_ORDER = orderOf(SEED_EXERCISES)
const EQUIPMENT_ORDER = orderOf(SEED_EQUIPMENT)
export const sortBySeedOrder = (list: Exercise[]) => sortedBy(EXERCISE_ORDER, list)
export const sortEquipmentBySeedOrder = (list: Equipment[]) => sortedBy(EQUIPMENT_ORDER, list)

/** Dexie "populate" handler: fills a brand-new database with the built-in data. */
export async function seed(tx: Transaction) {
  await tx.table('equipment').bulkAdd(SEED_EQUIPMENT)
  await tx.table('exercises').bulkAdd(SEED_EXERCISES)
  await tx.table('gyms').add(NO_EQUIPMENT_GYM)
  await tx.table('settings').add(DEFAULT_SETTINGS)
}
