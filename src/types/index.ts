// One type per IndexedDB table (see "Data model" in docs/dayload-spec.md).
// Everything is stored metric: kg and cm. Units only change what is shown and typed.

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'
export type WorkoutMode = 'timetable' | 'adaptive'
export type WeightUnit = 'kg' | 'lb'
export type LengthUnit = 'cm' | 'ftin'

/** Dates are local calendar days as "YYYY-MM-DD" strings (never UTC timestamps). */
export type DateKey = string

/** Single row, always id 1. */
export interface Profile {
  id: number
  age: number
  heightCm: number
}

export interface BodyLog {
  id?: number
  date: DateKey
  weightKg: number
  /** Body measurements in cm, keyed by name (waist, arm...). Filled in a later phase. */
  measurements?: Record<string, number>
}

export interface Goal {
  id?: number
  type: 'weight' | 'measurement'
  /** Which measurement, when type is "measurement". */
  measurement?: string
  /** kg for weight goals, cm for measurement goals. */
  target: number
  deadline?: DateKey
  /** Where you were when the goal was set (kg or cm), so progress has a starting point. Older rows may lack it. */
  start?: number
  startDate?: DateKey
}

export interface Equipment {
  id: string
  name: string
  /** The heading it is listed under: "Free weights", "Cable", ... */
  group: string
}

export interface HowTo {
  targetMuscles: string[]
  cues: string[]
  mistakes: string[]
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  /** All of these must be at the gym. Empty means bodyweight. */
  equipmentIds: string[]
  /** Same muscle group, used when this exercise is not possible at the gym. */
  alternativeIds: string[]
  howTo: HowTo
  isCustom: boolean
}

export interface Gym {
  /** "no-equipment" for the built-in gym, a UUID for gyms the user creates. */
  id: string
  name: string
  equipmentIds: string[]
  isTemporary: boolean
  isBuiltIn: boolean
}

export interface TimetableDay {
  /** 0 = Sunday ... 6 = Saturday, same as Date#getDay(). */
  dayOfWeek: number
  /** null is a rest day. */
  muscleGroup: MuscleGroup | null
  defaultGymId?: string
}

export interface Session {
  id?: number
  date: DateKey
  gymId: string
  muscleGroup: MuscleGroup
  /** The time the user said they had: 30, 45 or 60. */
  plannedMin: number
  /** Real minutes, filled in when the session finishes. 0 while it is running. */
  durationMin: number
  /** Date.now() when the session was built. */
  startedAt: number
  /** Date.now() when it finished. Missing means the session is still in progress. */
  finishedAt?: number
  /** The planned exercises in order. Swapping an exercise replaces its entry. */
  exerciseIds: string[]
  /** Index into exerciseIds of the exercise on screen, so "Continue workout" resumes in place. */
  currentIndex: number
  setsPerExercise: number
}

export interface WorkoutSet {
  id?: number
  sessionId: number
  exerciseId: string
  reps: number
  weightKg: number
  /** Set number within its exercise, starting at 0. (id order is the order they were logged.) */
  order: number
}

/** Single row, always id 1. */
export interface Settings {
  id: number
  workoutMode: WorkoutMode
  avoidIds: string[]
  favoriteIds: string[]
  weightUnit: WeightUnit
  lengthUnit: LengthUnit
}
