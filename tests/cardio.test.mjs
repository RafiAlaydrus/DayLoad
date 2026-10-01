import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BACKUP_VERSION, BackupError, parseBackup, TABLE_NAMES } from '../src/lib/backup.ts'
import { allowsSteps, CARDIO_KINDS, cardioText, goalProgress, goalText, isRestDay, minutesBetween } from '../src/lib/cardio.ts'
import { weeklyStreak } from '../src/lib/streak.ts'
import { validateCardioGoal, validateCardioMinutes, validateOptionalSteps } from '../src/lib/validate.ts'

test('cardio text: a goal reads as minutes or steps with thousands separators', () => {
  assert.equal(goalText({ type: 'minutes', value: 30 }), '30 min')
  assert.equal(goalText({ type: 'steps', value: 8000 }), '8,000 steps')
  assert.equal(goalText({ type: 'steps', value: 12500 }), '12,500 steps')
  assert.equal(cardioText({ kind: 'treadmill', goal: { type: 'minutes', value: 30 } }), 'Treadmill 30 min')
  assert.equal(cardioText({ kind: 'walk', goal: { type: 'steps', value: 10000 } }), 'Walk 10,000 steps')
})

test('cardio kinds: only the ones you walk or run on can have a step goal', () => {
  assert.deepEqual(CARDIO_KINDS.filter((k) => k.steps).map((k) => k.id), ['treadmill', 'walk', 'run'])
  assert.equal(allowsSteps('cycling'), false)
  assert.match(validateCardioGoal('cycling', 'steps', '8000').error, /only works for walking/)
  assert.equal(validateCardioGoal('walk', 'steps', '8000').value, 8000)
})

test('cardio validation: whole minutes 1 to 600, steps 100 to 100,000, steps after a session are optional', () => {
  assert.equal(validateCardioMinutes('30').value, 30)
  for (const bad of ['', '0', '601', '12.5', 'abc']) assert.ok(validateCardioMinutes(bad).error, `minutes "${bad}"`)
  assert.equal(validateCardioGoal('run', 'minutes', '45').value, 45)
  assert.ok(validateCardioGoal('run', 'steps', '50').error)
  assert.ok(validateCardioGoal('run', 'steps', '100001').error)
  assert.equal(validateOptionalSteps('').value, null)
  assert.equal(validateOptionalSteps('  ').value, null)
  assert.equal(validateOptionalSteps('6500').value, 6500)
  assert.ok(validateOptionalSteps('12').error)
})

test('cardio progress: toward a goal, clamped, empty without one', () => {
  assert.equal(goalProgress({ type: 'minutes', value: 30 }, 15), 0.5)
  assert.equal(goalProgress({ type: 'minutes', value: 30 }, 45), 1)
  assert.equal(goalProgress({ type: 'steps', value: 8000 }, 99, 2000), 0.25)
  assert.equal(goalProgress({ type: 'steps', value: 8000 }, 99), 0)
  assert.equal(goalProgress(undefined, 10), 0)
  assert.equal(minutesBetween(0, 20_000), 1) // a quick one still counts
  assert.equal(minutesBetween(0, 32 * 60_000 + 10_000), 32)
})

test('timetable days: no group and no cardio is a rest day, cardio alone is not', () => {
  assert.equal(isRestDay({ dayOfWeek: 1, muscleGroup: null }), true)
  assert.equal(isRestDay({ dayOfWeek: 1, muscleGroup: 'chest' }), false)
  assert.equal(isRestDay({ dayOfWeek: 1, muscleGroup: null, cardio: { kind: 'walk', goal: { type: 'minutes', value: 30 } } }), false)
})

test('streak: a cardio session counts as a workout toward the week', () => {
  const lift = (date) => ({ date })
  // Monday and Tuesday lifting, Thursday cardio: three in the week of 2026-09-28.
  assert.equal(weeklyStreak([lift('2026-09-28'), lift('2026-09-29'), { date: '2026-10-01' }], '2026-10-01').weeks, 1)
  assert.equal(weeklyStreak([lift('2026-09-28'), lift('2026-09-29')], '2026-10-01').weeks, 0)
})

const tablesWith = (extra) => ({ ...Object.fromEntries(TABLE_NAMES.map((n) => [n, []])), ...extra })
const file = (tables, version = BACKUP_VERSION) => JSON.stringify({ app: 'dayload', version, exportedAt: '2026-10-01T10:00:00.000Z', tables })

test('backup: cardio sessions and timetable cardio plans pass validation, a bad kind does not', () => {
  const ok = tablesWith({
    cardio: [{ id: 1, date: '2026-10-01', kind: 'treadmill', startedAt: 1, finishedAt: 2, minutes: 30, steps: 4000 }],
    timetable: [{ dayOfWeek: 2, muscleGroup: null, cardio: { kind: 'walk', goal: { type: 'steps', value: 8000 } } }],
  })
  const parsed = parseBackup(file(ok))
  assert.equal(parsed.tables.cardio[0].minutes, 30)
  assert.equal(parsed.tables.timetable[0].cardio.goal.value, 8000)
  const bad = tablesWith({ cardio: [{ id: 1, date: '2026-10-01', kind: 'skydiving', startedAt: 1 }] })
  assert.throws(() => parseBackup(file(bad)), (e) => e instanceof BackupError && /bad "kind"/.test(e.message))
})
