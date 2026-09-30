import type { LengthUnit, WeightUnit } from '../types'

// The database is always kg and cm. These helpers only convert for display and input.

const LB_PER_KG = 2.2046226218
const CM_PER_IN = 2.54

export const kgToLb = (kg: number) => kg * LB_PER_KG
export const lbToKg = (lb: number) => lb / LB_PER_KG
export const ftInToCm = (ft: number, inches: number) => (ft * 12 + inches) * CM_PER_IN

export function cmToFtIn(cm: number) {
  const totalInches = Math.round(cm / CM_PER_IN)
  return { ft: Math.floor(totalInches / 12), inches: totalInches % 12 }
}

/** What a typed weight in the user's unit is worth in kg (3 decimals hides float noise like 72.57479999). */
export function toKg(value: number, unit: WeightUnit) {
  return unit === 'kg' ? value : Math.round(lbToKg(value) * 1000) / 1000
}

export const fromKg = (kg: number, unit: WeightUnit) => (unit === 'kg' ? kg : kgToLb(kg))

/** A set's weight as typed in the user's unit: "62.5", "60", or "" for bodyweight (0). */
export const loadText = (kg: number, unit: WeightUnit) => (kg === 0 ? '' : String(Math.round(fromKg(kg, unit) * 10) / 10))

/** Sanity limits for typed values (metric). Catches typos like 7.2 or 720, not real bodies. */
export const LIMITS = {
  weightKg: { min: 20, max: 400 },
  loadKg: { min: 0, max: 1000 },
  heightCm: { min: 50, max: 272 },
  age: { min: 5, max: 120 },
} as const

/** A measurement split for display: a big number with a small unit. Height in ft/in has two parts. */
export type Parts = readonly (readonly [value: string, unit: string])[]

export function weightParts(kg: number, unit: WeightUnit): Parts {
  return [[fromKg(kg, unit).toFixed(1), unit]]
}

export function heightParts(cm: number, unit: LengthUnit): Parts {
  if (unit === 'cm') return [[String(Math.round(cm)), 'cm']]
  const { ft, inches } = cmToFtIn(cm)
  return [
    [String(ft), 'ft'],
    [String(inches), 'in'],
  ]
}

export const partsToText = (parts: Parts) => parts.map(([value, unit]) => `${value} ${unit}`).join(' ')

/** Parses what a person typed into a number. Accepts a decimal comma. Returns NaN for empty or junk. */
export function parseDecimal(text: string): number {
  const trimmed = text.trim().replace(',', '.')
  return trimmed === '' ? NaN : Number(trimmed)
}
