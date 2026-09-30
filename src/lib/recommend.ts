import type { Exercise, MuscleGroup } from '../types'

// The recommender: pick exercises for a muscle group that a gym can support.
// Pure functions over plain data, so they are tested in Node with the real seed data.

export const MUSCLE_GROUPS: readonly MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']

export const muscleLabel = (group: MuscleGroup) => group[0].toUpperCase() + group.slice(1)

export const TIME_OPTIONS = [30, 45, 60] as const

/**
 * How big a session is for the time the user has. The spec leaves these numbers as an open
 * question (owner picked these for Phase 2), and Phase 3 replaces them with real time scaling.
 */
export const PLAN_BY_TIME: Record<number, { exercises: number; sets: number }> = {
  30: { exercises: 3, sets: 4 },
  45: { exercises: 5, sets: 4 },
  60: { exercises: 6, sets: 4 },
}

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

export const candidatesFor = (exercises: readonly Exercise[], group: MuscleGroup, gymEquipmentIds: readonly string[]) =>
  exercises.filter((e) => e.muscleGroup === group && canDo(e, gymEquipmentIds))

/**
 * Picks up to `count` exercises. `exercises` must already be in priority order (seed order:
 * heavy compound lifts first).
 *  1. Exercises that use equipment come before bodyweight ones.
 *  2. Exercises listed as alternatives of each other are the same movement, so a first pass
 *     skips those to get variety; a second pass fills any remaining slots with them.
 * The result is the same every time for the same gym, which suits progressive overload.
 */
export function recommend(
  exercises: readonly Exercise[],
  group: MuscleGroup,
  gymEquipmentIds: readonly string[],
  count: number,
): Exercise[] {
  const pool = candidatesFor(exercises, group, gymEquipmentIds)
  const ranked = [...pool.filter((e) => e.equipmentIds.length > 0), ...pool.filter((e) => e.equipmentIds.length === 0)]
  const similar = (a: Exercise, b: Exercise) => a.alternativeIds.includes(b.id) || b.alternativeIds.includes(a.id)

  const picked: Exercise[] = []
  for (const e of ranked) if (picked.length < count && !picked.some((p) => similar(p, e))) picked.push(e)
  for (const e of ranked) if (picked.length < count && !picked.includes(e)) picked.push(e)
  return picked
}

/** Exercises the user can swap `current` for: same muscle, possible here, not already planned. Its own alternatives come first. */
export function swapOptions(
  exercises: readonly Exercise[],
  current: Exercise,
  plannedIds: readonly string[],
  gymEquipmentIds: readonly string[],
): Exercise[] {
  const pool = candidatesFor(exercises, current.muscleGroup, gymEquipmentIds).filter(
    (e) => e.id !== current.id && !plannedIds.includes(e.id),
  )
  const listed = (e: Exercise) => current.alternativeIds.includes(e.id)
  return [...pool.filter(listed), ...pool.filter((e) => !listed(e))]
}
