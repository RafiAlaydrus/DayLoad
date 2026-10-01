import type { BodyLog, DateKey, Goal, LengthUnit, WeightUnit } from '../types'
import { formatDate } from './dates.ts'
import { fromCm, fromKg, measurementText, measurementUnit, partsToText, weightParts } from './units.ts'

// Measurements, goals and how far along a goal is. Pure, so it is tested in Node.

/** The five body measurements (the owner's pick). Stored in cm under these keys in `BodyLog.measurements`. */
export const MEASUREMENTS = [
  { id: 'waist', label: 'Waist' },
  { id: 'chest', label: 'Chest' },
  { id: 'hips', label: 'Hips' },
  { id: 'arm', label: 'Arm' },
  { id: 'thigh', label: 'Thigh' },
] as const

export type MeasurementId = (typeof MEASUREMENTS)[number]['id']

/** Something a goal can be about: your weight, or one of the measurements. */
export type Thing = 'weight' | MeasurementId

export const THINGS: readonly { id: Thing; label: string }[] = [{ id: 'weight', label: 'Weight' }, ...MEASUREMENTS]

export const thingLabel = (thing: Thing) => THINGS.find((t) => t.id === thing)?.label ?? thing

/** Weight goals are `type: 'weight'`; the rest are `type: 'measurement'` with the name in `measurement`. */
export const thingOf = (goal: Goal): Thing => (goal.type === 'weight' ? 'weight' : (goal.measurement as MeasurementId))

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export interface Reading {
  date: DateKey
  /** kg for weight, cm for a measurement. */
  value: number
}

/** Every logged value of a thing, oldest first. `logs` must be sorted oldest first. Junk in an imported file is skipped. */
export function readings(logs: readonly BodyLog[], thing: Thing): Reading[] {
  const out: Reading[] = []
  for (const log of logs) {
    const value = thing === 'weight' ? log.weightKg : log.measurements?.[thing]
    if (isNumber(value)) out.push({ date: log.date, value })
  }
  return out
}

/** The units the user chose, which decide how every weight and measurement reads. */
export interface Units {
  weight: WeightUnit
  length: LengthUnit
}

/** A value of a thing the way the user reads it: "78.0 kg" for weight, "80 cm" for a measurement. */
export const valueText = (thing: Thing, value: number, units: Units) =>
  thing === 'weight'
    ? partsToText(weightParts(value, units.weight))
    : `${measurementText(value, units.length)} ${measurementUnit(units.length)}`

/** How much a measurement moved since it was first logged, in the user's unit (null: fewer than two entries). */
export function changeSinceFirst(list: readonly Reading[], unit: LengthUnit): { amount: number; since: DateKey } | null {
  if (list.length < 2) return null
  const amount = Math.round((fromCm(list[list.length - 1].value, unit) - fromCm(list[0].value, unit)) * 10) / 10
  return { amount, since: list[0].date }
}

/** "Down 2 cm since 1 Sep". Words, not +/- signs, so it reads the same to everyone. */
export function changeText(change: { amount: number; since: DateKey }, unit: LengthUnit): string {
  const since = formatDate(change.since)
  if (change.amount === 0) return `No change since ${since}`
  return `${change.amount < 0 ? 'Down' : 'Up'} ${Math.abs(change.amount)} ${measurementUnit(unit)} since ${since}`
}

/** The measurements saved with one weigh-in: "Waist 80 · Chest 100 cm". Empty when there are none. */
export function measurementLine(log: BodyLog, unit: LengthUnit): string {
  const parts = MEASUREMENTS.flatMap((m) => {
    const cm = log.measurements?.[m.id]
    return isNumber(cm) ? [`${m.label} ${measurementText(cm, unit)}`] : []
  })
  return parts.length === 0 ? '' : `${parts.join(' · ')} ${measurementUnit(unit)}`
}

export interface Progress {
  /** 0 to 1: how much of the way from the start to the target you are. Moving the wrong way is 0. */
  fraction: number
  reached: boolean
}

/** Works for losing (target below start) and gaining (target above start) alike. */
export function goalProgress(start: number, current: number, target: number): Progress {
  if (target === start) return { fraction: 1, reached: true }
  const fraction = Math.min(1, Math.max(0, (current - start) / (target - start)))
  const reached = target > start ? current >= target : current <= target
  return { fraction, reached }
}

/** What is left to go, in the user's unit, as a positive number (0 once reached). */
export function remaining(thing: Thing, current: number, target: number, units: Units) {
  const toUnit = (v: number) => (thing === 'weight' ? fromKg(v, units.weight) : fromCm(v, units.length))
  return Math.round(Math.abs(toUnit(target) - toUnit(current)) * 10) / 10
}
