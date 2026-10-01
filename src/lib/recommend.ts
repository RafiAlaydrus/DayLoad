import type { Exercise, MuscleGroup } from '../types'

// The recommender: pick exercises for a muscle group that a gym can support.
// Pure functions over plain data, so they are tested in Node with the real seed data.

export const MUSCLE_GROUPS: readonly MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']

export const muscleLabel = (group: MuscleGroup) => group[0].toUpperCase() + group.slice(1)

/** The muscle groups of a timetable day or a session: the full list if it has one, else its single group (none for a rest day). */
export const groupsOf = (x: { muscleGroup: MuscleGroup | null; muscleGroups?: readonly MuscleGroup[] }): MuscleGroup[] =>
  x.muscleGroups?.length ? [...x.muscleGroups] : x.muscleGroup ? [x.muscleGroup] : []

/** "Chest", "Chest and Arms", "Chest, Back and Arms". */
export const groupsLabel = (groups: readonly MuscleGroup[]) =>
  groups.length < 2
    ? groups.map(muscleLabel).join('')
    : `${groups.slice(0, -1).map(muscleLabel).join(', ')} and ${muscleLabel(groups[groups.length - 1])}`

export const TIME_OPTIONS = [30, 45, 60] as const

/**
 * How big a session is for the time the user has (the owner's pick for Phase 3). The numbers come
 * from a pace estimate: a set takes about 2.25 min counting the 90 s rest, and changing to the next
 * exercise about 2 min. The 60 min plan leaves about 5 min free for the warm-up Phase 5 adds.
 */
export const SET_MIN = 2.25
export const STATION_MIN = 2
export const PLAN_BY_TIME: Record<number, { exercises: number; sets: number }> = {
  30: { exercises: 3, sets: 3 },
  45: { exercises: 4, sets: 4 },
  60: { exercises: 5, sets: 4 },
}

/** Minutes a plan takes at that pace. */
export const estimateMin = (exercises: number, sets: number) => Math.round(exercises * (sets * SET_MIN + STATION_MIN))

/** Equipment that also gives you another: an adjustable bench can be set flat, and a crossover is a cable machine. */
const IMPLIES: Record<string, string[]> = {
  'adjustable-bench': ['flat-bench'],
  'cable-crossover': ['cable-machine'],
}

export const withImplied = (ids: readonly string[]) => [...new Set(ids.flatMap((id) => [id, ...(IMPLIES[id] ?? [])]))]

/** An exercise is possible when the gym has every piece of equipment it needs. Bodyweight needs none. */
export const canDo = (exercise: Exercise, gymEquipmentIds: readonly string[]) => {
  const have = withImplied(gymEquipmentIds)
  return exercise.equipmentIds.every((id) => have.includes(id))
}

/** What the user marked in the exercise page: favorites are picked first, the avoid list is never suggested. */
export interface Prefs {
  avoidIds: readonly string[]
  favoriteIds: readonly string[]
}
const NO_PREFS: Prefs = { avoidIds: [], favoriteIds: [] }

export type Pref = 'favorite' | 'avoid'

/** Marks an exercise, or unmarks it if it already has that mark. It cannot be both, so choosing one clears the other. */
export function withPref(prefs: Prefs, id: string, pref: Pref) {
  const avoidIds = prefs.avoidIds.filter((x) => x !== id)
  const favoriteIds = prefs.favoriteIds.filter((x) => x !== id)
  const wasOn = (pref === 'favorite' ? prefs.favoriteIds : prefs.avoidIds).includes(id)
  if (!wasOn) (pref === 'favorite' ? favoriteIds : avoidIds).push(id)
  return { avoidIds, favoriteIds }
}

export const candidatesFor = (
  exercises: readonly Exercise[],
  group: MuscleGroup,
  gymEquipmentIds: readonly string[],
  avoidIds: readonly string[] = [],
) => exercises.filter((e) => e.muscleGroup === group && canDo(e, gymEquipmentIds) && !avoidIds.includes(e.id))

/**
 * Picks up to `count` exercises. `exercises` must already be in priority order (seed order:
 * heavy compound lifts first).
 *  1. Exercises that use equipment come before bodyweight ones.
 *  2. Favorites go ahead of everything else. Avoided exercises are left out.
 *  3. Exercises listed as alternatives of each other are the same movement, so a first pass
 *     skips those to get variety; a second pass fills any remaining slots with them.
 * The result is the same every time for the same gym, which suits progressive overload.
 */
export function recommend(
  exercises: readonly Exercise[],
  group: MuscleGroup,
  gymEquipmentIds: readonly string[],
  count: number,
  { avoidIds, favoriteIds }: Prefs = NO_PREFS,
): Exercise[] {
  const pool = candidatesFor(exercises, group, gymEquipmentIds, avoidIds)
  const byGear = [...pool.filter((e) => e.equipmentIds.length > 0), ...pool.filter((e) => e.equipmentIds.length === 0)]
  const ranked = [...byGear.filter((e) => favoriteIds.includes(e.id)), ...byGear.filter((e) => !favoriteIds.includes(e.id))]
  const similar = (a: Exercise, b: Exercise) => a.alternativeIds.includes(b.id) || b.alternativeIds.includes(a.id)

  const picked: Exercise[] = []
  for (const e of ranked) if (picked.length < count && !picked.some((p) => similar(p, e))) picked.push(e)
  for (const e of ranked) if (picked.length < count && !picked.includes(e)) picked.push(e)
  return picked
}

/**
 * A workout that combines muscle groups: the exercises are shared out between them one at a time
 * (chest, arms, chest, arms...), so every group gets its turn, and a group that runs out of
 * exercises at this gym hands its slots to the others. The result is grouped by muscle, in the
 * order given. One group is exactly `recommend`.
 */
export function recommendMix(
  exercises: readonly Exercise[],
  groups: readonly MuscleGroup[],
  gymEquipmentIds: readonly string[],
  count: number,
  prefs: Prefs = NO_PREFS,
): Exercise[] {
  const lists = groups.map((g) => recommend(exercises, g, gymEquipmentIds, count, prefs))
  const take = lists.map(() => 0)
  for (let left = count, moved = true; left > 0 && moved; ) {
    moved = false
    lists.forEach((list, i) => {
      if (left > 0 && take[i] < list.length) {
        take[i]++
        left--
        moved = true
      }
    })
  }
  return lists.flatMap((list, i) => list.slice(0, take[i]))
}

/** Exercises the user can swap `current` for: same muscle, possible here, not already planned, not avoided. Its own alternatives come first. */
export function swapOptions(
  exercises: readonly Exercise[],
  current: Exercise,
  plannedIds: readonly string[],
  gymEquipmentIds: readonly string[],
  avoidIds: readonly string[] = [],
): Exercise[] {
  const pool = candidatesFor(exercises, current.muscleGroup, gymEquipmentIds, avoidIds).filter(
    (e) => e.id !== current.id && !plannedIds.includes(e.id),
  )
  const listed = (e: Exercise) => current.alternativeIds.includes(e.id)
  return [...pool.filter(listed), ...pool.filter((e) => !listed(e))]
}
