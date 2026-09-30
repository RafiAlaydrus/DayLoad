import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { bmi } from '../src/lib/bmi.ts'
import { BackupError, backupSummary, parseBackup, TABLE_NAMES } from '../src/lib/backup.ts'
import { isDateKey, toDateKey } from '../src/lib/dates.ts'
import {
  cmToFtIn,
  ftInToCm,
  heightParts,
  parseDecimal,
  partsToText,
  toKg,
  weightParts,
} from '../src/lib/units.ts'

const close = (a, b, eps = 0.001) => assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`)

test('bmi: 72.4 kg at 175 cm is 23.6 (the mockup value)', () => {
  assert.equal(bmi(72.4, 175), 23.6)
})

test('weight: kg <-> lb round-trips and hides float noise', () => {
  assert.equal(toKg(72.4, 'kg'), 72.4)
  assert.equal(toKg(160, 'lb'), 72.575)
  assert.equal(weightParts(72.575, 'lb')[0][0], '160.0')
  assert.equal(partsToText(weightParts(72.4, 'kg')), '72.4 kg')
  // a lb value typed with one decimal survives kg storage and comes back the same
  for (const lb of [99.9, 132.5, 165.3, 200.1, 250]) {
    assert.equal(weightParts(toKg(lb, 'lb'), 'lb')[0][0], lb.toFixed(1))
  }
})

test('height: cm <-> ft/in, including the 12-inch rollover', () => {
  assert.deepEqual(cmToFtIn(175), { ft: 5, inches: 9 })
  assert.deepEqual(cmToFtIn(182.88), { ft: 6, inches: 0 }) // 71.99 in must be 6 ft 0, not 5 ft 12
  close(ftInToCm(5, 9), 175.26)
  assert.equal(partsToText(heightParts(175, 'ftin')), '5 ft 9 in')
  assert.equal(partsToText(heightParts(174.6, 'cm')), '175 cm')
})

test('parseDecimal: comma decimals, and empty or junk is NaN (never 0)', () => {
  assert.equal(parseDecimal('72,4'), 72.4)
  assert.equal(parseDecimal(' 72.4 '), 72.4)
  assert.ok(Number.isNaN(parseDecimal('')))
  assert.ok(Number.isNaN(parseDecimal('   ')))
  assert.ok(Number.isNaN(parseDecimal('abc')))
})

test('dates: local day keys, no UTC shift, impossible days rejected', () => {
  assert.equal(toDateKey(new Date(2026, 8, 30, 23, 59)), '2026-09-30')
  assert.ok(isDateKey('2026-09-30'))
  assert.ok(!isDateKey('2026-02-31'))
  assert.ok(!isDateKey('30/09/2026'))
  assert.ok(!isDateKey('2026-9-3'))
})

// ---- backup validation ----------------------------------------------------

const seedTables = {
  equipment: JSON.parse(readFileSync(new URL('../src/data/equipment.json', import.meta.url), 'utf8')),
  exercises: JSON.parse(readFileSync(new URL('../src/data/exercises.json', import.meta.url), 'utf8')).map((e) => ({
    ...e,
    isCustom: false,
  })),
}

/** A backup shaped exactly like db/backup.ts writes one, built from the real seed data. */
function goodBackup() {
  return {
    app: 'dayload',
    version: 1,
    exportedAt: '2026-09-30T12:00:00.000Z',
    tables: {
      profile: [{ id: 1, age: 30, heightCm: 175 }],
      bodyLogs: [
        { id: 1, date: '2026-09-01', weightKg: 74.1 },
        { id: 2, date: '2026-09-30', weightKg: 72.4 },
      ],
      goals: [],
      equipment: seedTables.equipment,
      exercises: seedTables.exercises,
      gyms: [{ id: 'no-equipment', name: 'No equipment', equipmentIds: [], isTemporary: false, isBuiltIn: true }],
      timetable: [],
      sessions: [],
      sets: [],
      settings: [
        { id: 1, workoutMode: 'timetable', avoidIds: [], favoriteIds: [], weightUnit: 'kg', lengthUnit: 'cm' },
      ],
    },
  }
}

const parse = (obj) => parseBackup(typeof obj === 'string' ? obj : JSON.stringify(obj))
const rejects = (input, pattern) => assert.throws(() => parse(input), (e) => e instanceof BackupError && pattern.test(e.message))

test('backup: a well-formed file (with the real seed data) is accepted and summarized', () => {
  const backup = parse(goodBackup())
  assert.deepEqual(Object.keys(backup.tables).sort(), [...TABLE_NAMES].sort())
  assert.deepEqual(backupSummary(backup), { exportedAt: '2026-09-30T12:00:00.000Z', weightEntries: 2, sessions: 0 })
})

test('backup: invalid files get a clear BackupError', () => {
  rejects('not json {', /not valid JSON/)
  rejects('[]', /not a DayLoad backup/)
  rejects({ hello: 'world' }, /not a DayLoad backup/)
  rejects({ ...goodBackup(), app: 'other-app' }, /not a DayLoad backup/)
  rejects({ ...goodBackup(), version: 99 }, /newer version/)

  const missing = goodBackup()
  delete missing.tables.bodyLogs
  rejects(missing, /"bodyLogs" data is missing/)

  const badWeight = goodBackup()
  badWeight.tables.bodyLogs[1].weightKg = '72.4'
  rejects(badWeight, /"bodyLogs" entry 2 has a bad "weightKg"/)

  const badDate = goodBackup()
  badDate.tables.bodyLogs[0].date = '2026-02-31'
  rejects(badDate, /"bodyLogs" entry 1 has a bad "date"/)

  const badUnit = goodBackup()
  badUnit.tables.settings[0].weightUnit = 'stone'
  rejects(badUnit, /"settings" entry 1 has a bad "weightUnit"/)

  const notARow = goodBackup()
  notARow.tables.goals = [42]
  rejects(notARow, /"goals" entry 1 is not a record/)
})

// ---- form validation ------------------------------------------------------

test('validate: age, height and weight accept sane input and explain bad input in the user\'s units', async () => {
  const { validateAge, validateDate, validateHeight, validateWeight, statsInputFrom, weightInputFrom } = await import(
    '../src/lib/validate.ts'
  )
  assert.equal(validateAge('30').value, 30)
  assert.match(validateAge('3.5').error, /whole number from 5 to 120/)
  assert.match(validateAge('').error, /whole number/)

  assert.equal(validateHeight('cm', '175', '').value, 175)
  assert.match(validateHeight('cm', '17', '').error, /50 to 272 cm/)
  close(validateHeight('ftin', '5', '9').value, 175.26)
  close(validateHeight('ftin', '6', '').value, 182.88) // empty inches means 0
  assert.match(validateHeight('ftin', '5', '12').error, /1 ft 8 in to 8 ft 11 in/)
  assert.match(validateHeight('ftin', '', '9').error, /Enter a height/)

  assert.equal(validateWeight('kg', '72,4').value, 72.4)
  assert.equal(validateWeight('lb', '160').value, 72.575)
  assert.match(validateWeight('kg', '7.2').error, /20 to 400 kg/)
  assert.match(validateWeight('lb', '5').error, /44 to 882 lb/)
  assert.match(validateWeight('kg', '').error, /Enter a weight/)

  assert.equal(validateDate('2020-01-01').value, '2020-01-01')
  assert.match(validateDate('').error, /Pick a date/)
  assert.match(validateDate('2999-01-01').error, /not in the future|earlier/)

  // Editing pre-fills in the current unit
  assert.deepEqual(statsInputFrom({ age: 30, heightCm: 175 }, 'cm'), { age: '30', heightA: '175', heightB: '' })
  assert.deepEqual(statsInputFrom({ age: 30, heightCm: 175 }, 'ftin'), { age: '30', heightA: '5', heightB: '9' })
  assert.equal(weightInputFrom(72.4, 'kg'), '72.4')
})
