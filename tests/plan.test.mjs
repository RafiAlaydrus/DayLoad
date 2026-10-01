import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BACKUP_VERSION, parseBackup, TABLE_NAMES } from '../src/lib/backup.ts'
import { addMonths, monthWeeks, plannedFor, WEEK_ORDER } from '../src/lib/calendar.ts'
import { addDays, daysBetween, todayKey } from '../src/lib/dates.ts'
import {
  changeSinceFirst,
  changeText,
  goalProgress,
  MEASUREMENTS,
  measurementLine,
  readings,
  remaining,
  thingLabel,
  thingOf,
} from '../src/lib/goals.ts'
import { measurementParts, measurementText, measurementUnit } from '../src/lib/units.ts'
import { validateDeadline, validateGoalTarget, validateMeasurement } from '../src/lib/validate.ts'

const close = (a, b, eps = 0.001) => assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`)
const log = (date, weightKg, measurements) => ({ date, weightKg, ...(measurements ? { measurements } : {}) })

test('monthWeeks: Monday-first weeks, days outside the month are null, 5 or 6 weeks', () => {
  const sept = monthWeeks('2026-09-01') // 1 September 2026 is a Tuesday
  assert.equal(sept.length, 5)
  assert.deepEqual(sept[0], [null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'])
  assert.deepEqual(sept[4], ['2026-09-28', '2026-09-29', '2026-09-30', null, null, null, null])
  assert.equal(sept.flat().filter(Boolean).length, 30)
  assert.ok(sept.every((week) => week.length === 7))

  assert.equal(monthWeeks('2026-03-01').length, 6) // starts on a Sunday, so it needs six rows
  assert.equal(monthWeeks('2026-02-01').flat().filter(Boolean).length, 28)
  assert.equal(monthWeeks('2028-02-01').flat().filter(Boolean).length, 29) // leap year
  // any day of the month gives the same grid once moved to the first
  assert.deepEqual(monthWeeks(addMonths('2026-09-17', 0)), sept)
})

test('addMonths: always the first of the month, across year ends and short months', () => {
  assert.equal(addMonths('2026-09-15', 1), '2026-10-01')
  assert.equal(addMonths('2026-12-10', 1), '2027-01-01')
  assert.equal(addMonths('2026-01-05', -1), '2025-12-01')
  assert.equal(addMonths('2026-01-31', 1), '2026-02-01') // not 3 March
  assert.equal(addMonths('2026-09-15', 0), '2026-09-01')
})

test('plannedFor: the timetable row for a date, Sunday is 0, an unset day is undefined', () => {
  const rows = [
    { dayOfWeek: 3, muscleGroup: 'chest', defaultGymId: 'g1' },
    { dayOfWeek: 0, muscleGroup: null },
  ]
  assert.equal(plannedFor('2026-09-30', rows).muscleGroup, 'chest') // a Wednesday
  assert.equal(plannedFor('2026-10-04', rows).muscleGroup, null) // a Sunday: rest
  assert.equal(plannedFor('2026-10-01', rows), undefined) // a Thursday: not set
  assert.deepEqual([...WEEK_ORDER], [1, 2, 3, 4, 5, 6, 0])
})

test('daysBetween: whole days, either direction', () => {
  assert.equal(daysBetween('2026-09-30', '2026-10-01'), 1)
  assert.equal(daysBetween('2026-10-01', '2026-09-30'), -1)
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2) // spans the US clock change
  assert.equal(daysBetween('2026-10-24', '2026-10-26'), 2) // spans the EU clock change
  assert.equal(daysBetween('2026-09-30', '2026-09-30'), 0)
})

test('readings: only real numbers, oldest first, junk from an imported file is skipped', () => {
  const logs = [
    log('2026-09-01', 80, { waist: 90, chest: 100 }),
    log('2026-09-08', 79.5, { waist: 'abc', chest: 100 }),
    log('2026-09-15', 79),
    log('2026-09-22', 78.5, { waist: 88 }),
  ]
  assert.deepEqual(readings(logs, 'waist'), [
    { date: '2026-09-01', value: 90 },
    { date: '2026-09-22', value: 88 },
  ])
  assert.deepEqual(readings(logs, 'weight').map((r) => r.value), [80, 79.5, 79, 78.5])
  assert.deepEqual(readings(logs, 'thigh'), [])
  assert.deepEqual(MEASUREMENTS.map((m) => m.id), ['waist', 'chest', 'hips', 'arm', 'thigh'])
})

test('changeSinceFirst: latest minus first in the user unit, nothing for a single entry', () => {
  const waist = [{ date: '2026-09-01', value: 90 }, { date: '2026-09-22', value: 88 }]
  assert.deepEqual(changeSinceFirst(waist, 'cm'), { amount: -2, since: '2026-09-01' })
  assert.equal(changeSinceFirst(waist, 'ftin').amount, -0.8) // 2 cm is 0.79 in
  assert.equal(changeSinceFirst(waist.slice(0, 1), 'cm'), null)
  assert.equal(changeSinceFirst([], 'cm'), null)
})

test('changeText and measurementLine: plain words, in the user unit, empty when nothing was measured', () => {
  assert.match(changeText({ amount: -2, since: '2026-09-01' }, 'cm'), /^Down 2 cm since /)
  assert.match(changeText({ amount: 0.8, since: '2026-09-01' }, 'ftin'), /^Up 0\.8 in since /)
  assert.match(changeText({ amount: 0, since: '2026-09-01' }, 'cm'), /^No change since /)
  const entry = log('2026-09-01', 80, { chest: 100, waist: 90, hips: 'x' }) // listed in the app's order, junk skipped
  assert.equal(measurementLine(entry, 'cm'), 'Waist 90 · Chest 100 cm')
  assert.equal(measurementLine(entry, 'ftin'), 'Waist 35.4 · Chest 39.4 in')
  assert.equal(measurementLine(log('2026-09-01', 80), 'cm'), '')
})

test('goalProgress: works for losing and gaining, clamps, and never divides by zero', () => {
  close(goalProgress(80, 78, 75).fraction, 0.4) // losing: 2 of 5 kg
  assert.equal(goalProgress(80, 78, 75).reached, false)
  assert.deepEqual(goalProgress(80, 75, 75), { fraction: 1, reached: true })
  assert.deepEqual(goalProgress(80, 74, 75), { fraction: 1, reached: true }) // went past it
  assert.deepEqual(goalProgress(80, 82, 75), { fraction: 0, reached: false }) // moved the wrong way
  close(goalProgress(70, 72, 75).fraction, 0.4) // gaining
  assert.equal(goalProgress(70, 75, 75).reached, true)
  assert.deepEqual(goalProgress(75, 75, 75), { fraction: 1, reached: true })
})

test('remaining: what is left, positive, in the unit the user sees', () => {
  const kg = { weight: 'kg', length: 'cm' }
  const imperial = { weight: 'lb', length: 'ftin' }
  assert.equal(remaining('weight', 78, 75, kg), 3)
  assert.equal(remaining('weight', 75, 78, kg), 3)
  assert.equal(remaining('weight', 78, 75, imperial), 6.6)
  assert.equal(remaining('waist', 90, 88, kg), 2)
  assert.equal(remaining('waist', 90, 88, imperial), 0.8)
})

test('things: weight and measurement goals map to one name each', () => {
  assert.equal(thingOf({ type: 'weight', target: 75 }), 'weight')
  assert.equal(thingOf({ type: 'measurement', measurement: 'waist', target: 88 }), 'waist')
  assert.equal(thingLabel('weight'), 'Weight')
  assert.equal(thingLabel('arm'), 'Arm')
})

test('measurement units: cm as is, inches for ft/in, stored in cm either way', () => {
  assert.equal(measurementUnit('cm'), 'cm')
  assert.equal(measurementUnit('ftin'), 'in')
  assert.equal(measurementText(80, 'cm'), '80')
  assert.equal(measurementText(80.01, 'ftin'), '31.5')
  assert.deepEqual(measurementParts(80, 'cm'), [['80', 'cm']])
  assert.deepEqual(measurementParts(81.28, 'ftin'), [['32', 'in']])
})

test('validateMeasurement: blank is fine, numbers are checked in the user unit', () => {
  assert.equal(validateMeasurement('cm', '').value, null)
  assert.equal(validateMeasurement('cm', '  ').value, null)
  assert.equal(validateMeasurement('cm', '80').value, 80)
  assert.equal(validateMeasurement('cm', '80,5').value, 80.5)
  close(validateMeasurement('ftin', '31.5').value, 80.01)
  assert.match(validateMeasurement('cm', '5').error, /10 to 300 cm/)
  assert.match(validateMeasurement('cm', 'abc').error, /Enter a measurement/)
  assert.match(validateMeasurement('ftin', '500').error, /4 to 118 in/)
})

test('validateGoalTarget: a weight is a weight, a measurement is a measurement, both required', () => {
  const kg = { weight: 'kg', length: 'cm' }
  assert.equal(validateGoalTarget('weight', kg, '75').value, 75)
  assert.equal(validateGoalTarget('weight', { weight: 'lb', length: 'cm' }, '165').value, 74.843)
  assert.match(validateGoalTarget('weight', kg, '').error, /Enter a weight/)
  assert.equal(validateGoalTarget('waist', kg, '88').value, 88)
  assert.match(validateGoalTarget('waist', kg, '').error, /Enter a target/)
  assert.match(validateGoalTarget('waist', kg, '2').error, /10 to 300 cm/)
})

test('validateDeadline: optional, but a real day after today', () => {
  assert.equal(validateDeadline('').value, null)
  assert.equal(validateDeadline(addDays(todayKey(), 30)).value, addDays(todayKey(), 30))
  assert.match(validateDeadline(todayKey()).error, /after today/)
  assert.match(validateDeadline('2020-01-01').error, /after today/)
  assert.match(validateDeadline('2026-02-31').error, /Pick a date/)
})

test('backup: goals, timetable rows (including rest) and measurements pass validation as they are stored', () => {
  const tables = Object.fromEntries(TABLE_NAMES.map((name) => [name, []]))
  tables.goals = [
    { id: 1, type: 'measurement', measurement: 'waist', target: 85, start: 90, startDate: '2026-10-01', deadline: '2026-12-01' },
    { id: 2, type: 'weight', target: 75 }, // a goal written before it had a start
  ]
  tables.timetable = [{ dayOfWeek: 1, muscleGroup: 'back', defaultGymId: 'g1' }, { dayOfWeek: 5, muscleGroup: null }]
  tables.bodyLogs = [log('2026-10-01', 80, { waist: 90 }), log('2026-09-01', 82)]
  const backup = { app: 'dayload', version: BACKUP_VERSION, exportedAt: '2026-10-01T10:00:00.000Z', tables }
  const parsed = parseBackup(JSON.stringify(backup))
  assert.equal(parsed.tables.goals.length, 2)
  assert.equal(parsed.tables.timetable[1].muscleGroup, null)
  assert.equal(parsed.tables.bodyLogs[0].measurements.waist, 90)
})
