import assert from 'node:assert/strict'
import { test } from 'node:test'
import { longestAgo, REST_AFTER_DAYS, trainingStreak } from '../src/lib/adaptive.ts'
import {
  beats,
  bestOf,
  bestText,
  lastSets,
  newRecords,
  overloadTarget,
  OVERLOAD_REPS,
  personalRecords,
  targetText,
} from '../src/lib/progress.ts'
import { loadText, toKg } from '../src/lib/units.ts'

let nextSetId = 1
const session = (id, date, muscleGroup = 'chest') => ({
  id,
  date,
  muscleGroup,
  startedAt: Date.parse(`${date}T10:00:00`),
  finishedAt: Date.parse(`${date}T11:00:00`),
})
const set = (sessionId, exerciseId, weightKg, reps, order = 0) => ({ id: nextSetId++, sessionId, exerciseId, weightKg, reps, order })

test('overload rule: every set at 8+ reps adds 2.5 kg, otherwise repeat the weight and aim for 8', () => {
  assert.equal(OVERLOAD_REPS, 8)
  // the Workout mockup: "Last time 60 kg × 8. Try 62.5 kg today."
  const hit = [set(1, 'bench', 60, 8, 0), set(1, 'bench', 60, 8, 1), set(1, 'bench', 60, 9, 2)]
  const up = overloadTarget(hit, 'kg')
  assert.deepEqual([up.weightKg, up.reps, up.progressed], [62.5, 8, true])
  assert.equal(targetText(up, 'kg'), 'Last time 60 kg × 9. Try 62.5 kg today.')
  assert.equal(targetText(overloadTarget([set(1, 'bench', 60, 8)], 'kg'), 'kg'), 'Last time 60 kg × 8. Try 62.5 kg today.')

  // one set short: same weight, aim for 8 on every set
  const short = overloadTarget([set(1, 'bench', 60, 8, 0), set(1, 'bench', 60, 6, 1)], 'kg')
  assert.deepEqual([short.weightKg, short.reps, short.progressed], [60, 8, false])
  assert.equal(targetText(short, 'kg'), 'Last time 60 kg × 8. Repeat 60 kg and aim for 8 on every set.')

  assert.equal(overloadTarget([], 'kg'), null)
})

test('overload rule: the step is 5 lb for a lb lifter (135 lb goes to 140 lb, not 137.5)', () => {
  const lastTime = [set(1, 'squat', toKg(135, 'lb'), 8)]
  const target = overloadTarget(lastTime, 'lb')
  assert.equal(loadText(target.weightKg, 'lb'), '140')
  assert.equal(targetText(target, 'lb'), 'Last time 135 lb × 8. Try 140 lb today.')
})

test('overload rule: bodyweight exercises aim for one more rep', () => {
  const target = overloadTarget([set(1, 'pull-up', 0, 8, 0), set(1, 'pull-up', 0, 10, 1), set(1, 'pull-up', 0, 7, 2)], 'kg')
  assert.deepEqual([target.weightKg, target.reps], [0, 11])
  assert.equal(targetText(target, 'kg'), 'Last time 10 reps. Try 11 today.')
})

test('beats: heavier wins, then more reps at the same weight, and bodyweight is ranked by reps', () => {
  assert.ok(beats({ weightKg: 62.5, reps: 5 }, { weightKg: 60, reps: 12 }))
  assert.ok(beats({ weightKg: 60, reps: 9 }, { weightKg: 60, reps: 8 }))
  assert.ok(!beats({ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }))
  assert.ok(beats({ weightKg: 0, reps: 11 }, { weightKg: 0, reps: 10 }))
  assert.deepEqual(bestOf([set(1, 'a', 50, 12), set(1, 'a', 60, 5), set(1, 'a', 60, 7)]).reps, 7)
  assert.equal(bestOf([]), undefined)
  assert.equal(bestText({ weightKg: 62.5, reps: 8 }, 'kg'), '62.5 kg × 8')
  assert.equal(bestText({ weightKg: 0, reps: 10 }, 'kg'), 'Bodyweight × 10')
})

test('lastSets: the most recent finished session that had the exercise, in set order', () => {
  const history = {
    sessions: [session(1, '2026-09-01'), session(2, '2026-09-08'), session(3, '2026-09-15', 'back')],
    sets: [
      set(1, 'bench', 55, 8, 0),
      set(2, 'bench', 60, 8, 1),
      set(2, 'bench', 60, 8, 0),
      set(2, 'fly', 20, 12, 0),
      set(3, 'row', 50, 10, 0),
    ],
  }
  assert.deepEqual(lastSets(history, 'bench').map((s) => [s.weightKg, s.order]), [[60, 0], [60, 1]])
  assert.deepEqual(lastSets(history, 'row').map((s) => s.weightKg), [50])
  assert.deepEqual(lastSets(history, 'squat'), [])
})

test('personal records: best set per exercise, newest record first, ties keep the earlier day', () => {
  const history = {
    sessions: [session(1, '2026-09-01'), session(2, '2026-09-08'), session(3, '2026-09-15')],
    sets: [
      set(1, 'bench', 60, 8),
      set(2, 'bench', 62.5, 6),
      set(3, 'bench', 62.5, 6), // equal to the record, not a new one
      set(1, 'pull-up', 0, 10),
      set(3, 'pull-up', 0, 9),
      set(3, 'squat', 80, 6),
      set(99, 'ghost', 100, 1), // its session is not finished, so it is not history
    ],
  }
  assert.deepEqual(
    personalRecords(history).map((r) => [r.exerciseId, r.weightKg, r.reps, r.date]),
    [
      ['squat', 80, 6, '2026-09-15'],
      ['bench', 62.5, 6, '2026-09-08'],
      ['pull-up', 0, 10, '2026-09-01'],
    ],
  )
  assert.deepEqual(personalRecords({ sessions: [], sets: [] }), [])
})

test('new records: only a set that beats an earlier session counts, and the first time is a starting point', () => {
  const sessions = [session(1, '2026-09-01'), session(2, '2026-09-08'), session(3, '2026-09-15')]
  const history = {
    sessions,
    sets: [
      set(1, 'bench', 60, 8),
      set(2, 'bench', 62.5, 8), // heavier: record
      set(2, 'pull-up', 0, 10), // first time ever: no record
      set(3, 'bench', 62.5, 8), // equal: no record
      set(3, 'pull-up', 0, 11), // more reps at bodyweight: record
    ],
  }
  assert.deepEqual(newRecords(history, sessions[0]), [])
  const second = newRecords(history, sessions[1])
  assert.deepEqual(second.map((r) => [r.exerciseId, r.now.weightKg, r.before.weightKg]), [['bench', 62.5, 60]])
  const third = newRecords(history, sessions[2])
  assert.deepEqual(third.map((r) => [r.exerciseId, r.now.reps, r.before.reps]), [['pull-up', 11, 10]])
})

test('adaptive: the group trained longest ago, never-trained groups first, ties in list order', () => {
  assert.deepEqual(longestAgo([]), { group: 'chest', last: null })
  const trained = [session(1, '2026-09-01', 'chest'), session(2, '2026-09-02', 'back'), session(3, '2026-09-03', 'shoulders')]
  // arms, legs and core were never trained: arms comes first in the list
  assert.deepEqual(longestAgo(trained), { group: 'arms', last: null })
  const all = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'].map((g, i) => session(i + 1, `2026-09-0${6 - i}`, g))
  // core was trained on 09-01, the oldest
  assert.deepEqual(longestAgo(all), { group: 'core', last: '2026-09-01' })
  // training the same group again moves its last day forward
  assert.deepEqual(longestAgo([...all, session(9, '2026-09-10', 'core')]), { group: 'legs', last: '2026-09-02' })
})

test('adaptive: rest is suggested after 3 training days in a row', () => {
  assert.equal(REST_AFTER_DAYS, 3)
  const days = (...keys) => keys.map((d, i) => session(i + 1, d))
  const run = days('2026-09-28', '2026-09-29', '2026-09-30') // Mon, Tue, Wed
  assert.equal(trainingStreak(run, '2026-10-01'), 3) // Thursday, counting back from yesterday
  assert.equal(trainingStreak(run, '2026-09-30'), 3) // Wednesday, already trained today
  assert.equal(trainingStreak(run.slice(0, 2), '2026-09-30'), 2) // Wednesday, not trained yet
  assert.equal(trainingStreak(run, '2026-10-02'), 0) // a rest day in between resets it
  assert.equal(trainingStreak(days('2026-09-26', '2026-09-28', '2026-09-29'), '2026-09-30'), 2) // a gap ends the run
  assert.equal(trainingStreak([], '2026-09-30'), 0)
  // two workouts on one day are one day, and a run can cross a month end
  assert.equal(trainingStreak([session(1, '2026-09-30'), session(2, '2026-09-30'), session(3, '2026-09-29')], '2026-10-01'), 2)
})

test('adaptive: a workout that combined groups counts for every group in it', () => {
  const combined = { ...session(1, '2026-09-20', 'chest'), muscleGroups: ['chest', 'arms'] }
  const rest = ['back', 'shoulders', 'legs', 'core'].map((g, i) => session(i + 2, '2026-09-10', g))
  // chest and arms were trained on the 20th, the others on the 10th, so the longest-ago one is back.
  assert.deepEqual(longestAgo([combined, ...rest]), { group: 'back', last: '2026-09-10' })
})
