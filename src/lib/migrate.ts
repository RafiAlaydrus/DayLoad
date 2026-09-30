// Data upgrades that are more than a schema change. Pure, so the same code runs in the Dexie
// upgrade (a phone that already has data) and in backup import (an older backup file), and
// both are tested in Node.

interface HasEquipment {
  equipmentIds?: unknown
}

/** What each equipment id from data version 1 turned into. Ids that did not change are not listed. */
const V1_TO_V2: Record<string, string[]> = {
  'incline-bench': ['adjustable-bench'],
  // The old "Pec deck / rear delt machine" became two items. A gym that ticked it had both.
  'pec-deck': ['pec-deck', 'rear-delt-machine'],
}

export function remapEquipmentIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.flatMap((id: string) => V1_TO_V2[id] ?? [id]))]
}

/**
 * Version 2 replaced the built-in equipment list (40 items in groups) and exercise list. The
 * built-in rows are refreshed from the seed; custom exercises and everything the user made
 * (gyms, sessions, weights) are kept, with equipment ids translated to the new list.
 */
export function migrateToV2<E, S, X extends HasEquipment & { isCustom?: unknown }, G extends HasEquipment>(
  current: { exercises: X[]; gyms: G[] },
  /** The built-in lists as shipped (exercises already marked isCustom: false). */
  seed: { equipment: E[]; exercises: S[] },
) {
  const custom = current.exercises
    .filter((e) => e.isCustom === true)
    .map((e) => ({ ...e, equipmentIds: remapEquipmentIds(e.equipmentIds) }))
  return {
    equipment: seed.equipment,
    exercises: [...seed.exercises, ...custom],
    gyms: current.gyms.map((g) => ({ ...g, equipmentIds: remapEquipmentIds(g.equipmentIds) })),
  }
}
