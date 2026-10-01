import type { LengthUnit, WeightUnit } from '../types'
import { isDateKey, todayKey } from './dates.ts'
import type { Thing, Units } from './goals.ts'
import { cmToFtIn, cmToIn, fromKg, ftInToCm, heightParts, inToCm, LIMITS, parseDecimal, partsToText, toKg } from './units.ts'

// Turns what a person typed (text, in their units) into metric numbers, or a message to show.

interface Ok<T> {
  value: T
  error?: undefined
}
interface Bad {
  value?: undefined
  error: string
}
type Result<T> = Ok<T> | Bad

/** The age and height fields as typed. Height is one field in cm, or feet (A) and inches (B). */
export interface StatsInput {
  age: string
  heightA: string
  heightB: string
}

export function statsInputFrom(profile: { age: number; heightCm: number } | null, unit: LengthUnit): StatsInput {
  if (!profile) return { age: '', heightA: '', heightB: '' }
  const age = String(profile.age)
  if (unit === 'cm') return { age, heightA: String(Math.round(profile.heightCm * 10) / 10), heightB: '' }
  const { ft, inches } = cmToFtIn(profile.heightCm)
  return { age, heightA: String(ft), heightB: String(inches) }
}

export const weightInputFrom = (kg: number, unit: WeightUnit) => fromKg(kg, unit).toFixed(1)

export function validateAge(text: string): Result<number> {
  const age = parseDecimal(text)
  const { min, max } = LIMITS.age
  if (!Number.isInteger(age) || age < min || age > max) {
    return { error: `Enter your age as a whole number from ${min} to ${max}.` }
  }
  return { value: age }
}

export function validateHeight(unit: LengthUnit, a: string, b: string): Result<number> {
  const { min, max } = LIMITS.heightCm
  const range =
    unit === 'cm'
      ? `${min} to ${max} cm`
      : `${partsToText(heightParts(min, 'ftin'))} to ${partsToText(heightParts(max, 'ftin'))}`
  const inches = b.trim() === '' ? 0 : parseDecimal(b)
  const cm = unit === 'cm' ? parseDecimal(a) : ftInToCm(parseDecimal(a), inches)
  const badInches = unit === 'ftin' && !(inches >= 0 && inches < 12)
  if (!(cm >= min && cm <= max) || badInches) return { error: `Enter a height from ${range}.` }
  return { value: cm }
}

export function validateWeight(unit: WeightUnit, text: string): Result<number> {
  const { min, max } = LIMITS.weightKg
  const kg = toKg(parseDecimal(text), unit)
  if (!(kg >= min && kg <= max)) {
    return { error: `Enter a weight from ${Math.round(fromKg(min, unit))} to ${Math.round(fromKg(max, unit))} ${unit}.` }
  }
  return { value: kg }
}

const measurementRange = (unit: LengthUnit) => {
  const { min, max } = LIMITS.measurementCm
  return unit === 'cm' ? `${min} to ${max} cm` : `${Math.round(cmToIn(min))} to ${Math.round(cmToIn(max))} in`
}

/** An optional body measurement. Blank means "not measured" and gives null. */
export function validateMeasurement(unit: LengthUnit, text: string): Result<number | null> {
  if (text.trim() === '') return { value: null }
  const { min, max } = LIMITS.measurementCm
  const cm = unit === 'cm' ? parseDecimal(text) : inToCm(parseDecimal(text))
  if (!(cm >= min && cm <= max)) return { error: `Enter a measurement from ${measurementRange(unit)}, or leave it blank.` }
  return { value: cm }
}

/** The target of a goal, in kg (weight) or cm (a measurement). Required. */
export function validateGoalTarget(thing: Thing, units: Units, text: string): Result<number> {
  if (thing === 'weight') return validateWeight(units.weight, text)
  const { min, max } = LIMITS.measurementCm
  const cm = units.length === 'cm' ? parseDecimal(text) : inToCm(parseDecimal(text))
  if (!(cm >= min && cm <= max)) return { error: `Enter a target from ${measurementRange(units.length)}.` }
  return { value: cm }
}

/** The deadline of a goal is optional, but if there is one it must be a real day after today. */
export function validateDeadline(text: string): Result<string | null> {
  if (text === '') return { value: null }
  if (!isDateKey(text)) return { error: 'Pick a date, or clear the deadline.' }
  if (text <= todayKey()) return { error: 'Pick a day after today, or clear the deadline.' }
  return { value: text }
}

/** A weigh-in date must be a real day, and not in the future. */
export function validateDate(text: string): Result<string> {
  if (!isDateKey(text)) return { error: 'Pick a date.' }
  if (text > todayKey()) return { error: 'Pick today or an earlier date.' }
  return { value: text }
}

export function validateReps(text: string): Result<number> {
  const reps = parseDecimal(text)
  if (!Number.isInteger(reps) || reps < 1 || reps > 200) return { error: 'Enter reps from 1 to 200.' }
  return { value: reps }
}

/** The weight of one set. Blank means bodyweight, stored as 0. */
export function validateLoad(unit: WeightUnit, text: string): Result<number> {
  if (text.trim() === '') return { value: 0 }
  const kg = toKg(parseDecimal(text), unit)
  if (!(kg >= 0 && kg <= LIMITS.loadKg.max)) {
    return { error: `Enter a weight up to ${Math.round(fromKg(LIMITS.loadKg.max, unit))} ${unit}, or leave it blank for bodyweight.` }
  }
  return { value: kg }
}
