import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { addDays, weekStartKey } from '../src/lib/dates.ts'
import { clock, groupBy, listNames, namesOf } from '../src/lib/format.ts'
import {
  canDo,
  candidatesFor,
  estimateMin,
  groupsLabel,
  groupsOf,
  MUSCLE_GROUPS,
  PLAN_BY_TIME,
  recommend,
  recommendMix,
  swapOptions,
  TIME_OPTIONS,
  withPref,
} from '../src/lib/recommend.ts'
import { validateLoad, validateReps } from '../src/lib/validate.ts'

const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'))
const exercises = load('exercises').map((e) => ({ ...e, isCustom: false }))
const allEquipment = load('equipment').map((e) => e.id)
const byId = new Map(exercises.map((e) => [e.id, e]))

const GYMS = {
  full: allEquipment,
  condo: ['dumbbells', 'flat-bench', 'incline-bench', 'pull-up-bar'],
  dumbbells: ['dumbbells'],
  none: [],
}

test('recommend: every pick is possible at the gym, unique, and the right muscle', () => {
  for (const [gymName, equipment] of Object.entries(GYMS)) {
    for (const group of MUSCLE_GROUPS) {
      for (const count of [3, 5, 6]) {
        const picks = recommend(exercises, group, equipment, count)
        const at = `${gymName}/${group}/${count}`
        assert.equal(new Set(picks.map((e) => e.id)).size, picks.length, `${at}: duplicates`)
        assert.ok(picks.every((e) => e.muscleGroup === group && canDo(e, equipment)), `${at}: impossible pick`)
        assert.equal(picks.length, Math.min(count, candidatesFor(exercises, group, equipment).length), `${at}: wrong size`)
      }
    }
  }
})

test('recommend: "No equipment" always gets at least two exercises per muscle group', () => {
  for (const group of MUSCLE_GROUPS) assert.ok(recommend(exercises, group, [], 5).length >= 2, group)
})

test('recommend: same gym gives the same plan, heavy compound lifts first, no near-duplicate movements early', () => {
  const chest = recommend(exercises, 'chest', GYMS.full, 5).map((e) => e.id)
  assert.deepEqual(chest, recommend(exercises, 'chest', GYMS.full, 5).map((e) => e.id))
  assert.equal(chest[0], 'barbell-bench-press')
  // the first three are different movements: none lists another as its alternative
  const first3 = chest.slice(0, 3).map((id) => byId.get(id))
  for (const a of first3) for (const b of first3) if (a !== b) assert.ok(!a.alternativeIds.includes(b.id), `${a.id} vs ${b.id}`)
})

test('recommend: equipment exercises come before bodyweight ones when the gym has both', () => {
  const picks = recommend(exercises, 'shoulders', GYMS.condo, 4)
  assert.ok(picks[0].equipmentIds.length > 0)
})

test('swapOptions: same muscle, possible here, not planned, own alternatives first', () => {
  const current = byId.get('barbell-bench-press')
  const planned = ['barbell-bench-press', 'incline-dumbbell-press']
  const options = swapOptions(exercises, current, planned, GYMS.full)
  assert.ok(options.length > 0)
  assert.ok(options.every((e) => e.muscleGroup === 'chest' && canDo(e, GYMS.full) && !planned.includes(e.id)))
  const listedCount = options.filter((e) => current.alternativeIds.includes(e.id)).length
  assert.ok(options.slice(0, listedCount).every((e) => current.alternativeIds.includes(e.id)), 'alternatives must lead')
  // a gym that can only do bodyweight has one other chest exercise to swap to
  assert.deepEqual(swapOptions(exercises, byId.get('push-up'), ['push-up'], []).map((e) => e.id), ['wide-push-up'])
})

test('time plans: 30/45/60 minutes are 3x3, 4x4 and 5x4, each fits its time and one more exercise would not', () => {
  assert.deepEqual(TIME_OPTIONS, [30, 45, 60])
  assert.deepEqual(TIME_OPTIONS.map((t) => [PLAN_BY_TIME[t].exercises, PLAN_BY_TIME[t].sets]), [[3, 3], [4, 4], [5, 4]])
  for (const t of TIME_OPTIONS) {
    const { exercises: n, sets } = PLAN_BY_TIME[t]
    assert.ok(estimateMin(n, sets) <= t, `${t} min: the plan takes ${estimateMin(n, sets)}`)
    assert.ok(estimateMin(n + 1, sets) > t, `${t} min: there was room for another exercise`)
  }
  assert.deepEqual(TIME_OPTIONS.map((t) => estimateMin(PLAN_BY_TIME[t].exercises, PLAN_BY_TIME[t].sets)), [26, 44, 55])
})

test('avoid and favorites: avoided exercises never appear, favorites get a slot and lead the plan', () => {
  const none = { avoidIds: [], favoriteIds: [] }
  const plain = recommend(exercises, 'chest', GYMS.full, 4)
  assert.deepEqual(recommend(exercises, 'chest', GYMS.full, 4, none).map((e) => e.id), plain.map((e) => e.id))

  const avoided = plain[0]
  const without = recommend(exercises, 'chest', GYMS.full, 4, { avoidIds: [avoided.id], favoriteIds: [] })
  assert.equal(without.length, 4)
  assert.ok(without.every((e) => e.id !== avoided.id))

  // a chest exercise that missed the cut is picked, and goes first, once it is a favorite
  const missed = candidatesFor(exercises, 'chest', GYMS.full).find((e) => !plain.includes(e))
  const liked = recommend(exercises, 'chest', GYMS.full, 4, { avoidIds: [], favoriteIds: [missed.id] })
  assert.equal(liked[0].id, missed.id)
  assert.equal(liked.length, 4)

  // a bodyweight favorite still beats the equipment exercises for a slot
  const pushUp = recommend(exercises, 'chest', GYMS.full, 3, { avoidIds: [], favoriteIds: ['push-up'] })
  assert.equal(pushUp[0].id, 'push-up')

  // nothing left to pick: an empty plan, not a crash
  const every = candidatesFor(exercises, 'core', GYMS.none).map((e) => e.id)
  assert.deepEqual(recommend(exercises, 'core', GYMS.none, 3, { avoidIds: every, favoriteIds: [] }), [])
  assert.equal(candidatesFor(exercises, 'core', GYMS.none, every).length, 0)
})

test('avoid list: an avoided exercise is not offered as a swap either', () => {
  const current = byId.get('barbell-bench-press')
  const options = swapOptions(exercises, current, [current.id], GYMS.full)
  const avoided = options[0].id
  assert.ok(swapOptions(exercises, current, [current.id], GYMS.full, [avoided]).every((e) => e.id !== avoided))
})

test('withPref: toggles a mark, and an exercise cannot be both favorite and avoided', () => {
  const start = { avoidIds: ['a'], favoriteIds: ['b'] }
  assert.deepEqual(withPref(start, 'c', 'favorite'), { avoidIds: ['a'], favoriteIds: ['b', 'c'] })
  assert.deepEqual(withPref(start, 'b', 'favorite'), { avoidIds: ['a'], favoriteIds: [] }) // tapping again unmarks
  assert.deepEqual(withPref(start, 'a', 'favorite'), { avoidIds: [], favoriteIds: ['b', 'a'] }) // avoid becomes favorite
  assert.deepEqual(withPref(start, 'b', 'avoid'), { avoidIds: ['a', 'b'], favoriteIds: [] }) // favorite becomes avoid
  assert.deepEqual(start, { avoidIds: ['a'], favoriteIds: ['b'] }) // the input is not changed
})

test('week: Monday-based weeks and day arithmetic', () => {
  assert.equal(weekStartKey('2026-09-30'), '2026-09-28') // Wednesday
  assert.equal(weekStartKey('2026-09-28'), '2026-09-28') // Monday itself
  assert.equal(weekStartKey('2026-10-04'), '2026-09-28') // Sunday belongs to the week that started Monday
  assert.equal(addDays('2026-09-30', 1), '2026-10-01')
  assert.equal(addDays('2026-01-01', -1), '2025-12-31')
})

test('format: name lists and clocks', () => {
  assert.equal(listNames(['A', 'B']), 'A, B')
  assert.equal(listNames(['A', 'B', 'C', 'D', 'E', 'F']), 'A, B, C, D +2 more')
  assert.equal(listNames([]), '')
  assert.equal(clock(0), '0:00')
  assert.equal(clock(84), '1:24')
  assert.equal(clock(3725), '62:05')
  assert.equal(clock(-5), '0:00')
})

test('set validation: reps are whole numbers, weight is optional (blank = bodyweight)', () => {
  assert.equal(validateReps('8').value, 8)
  assert.match(validateReps('').error, /reps/)
  assert.match(validateReps('0').error, /reps/)
  assert.match(validateReps('8.5').error, /reps/)
  assert.equal(validateLoad('kg', '').value, 0)
  assert.equal(validateLoad('kg', '62,5').value, 62.5)
  assert.equal(validateLoad('lb', '135').value, 61.235)
  assert.match(validateLoad('kg', '-5').error, /Enter a weight/)
  assert.match(validateLoad('kg', 'abc').error, /Enter a weight/)
  assert.match(validateLoad('kg', '5000').error, /1000 kg/)
})

test('implied equipment: an adjustable bench can be set flat, a crossover is a cable machine', () => {
  const benchPress = byId.get('dumbbell-bench-press') // needs a flat bench
  assert.ok(canDo(benchPress, ['dumbbells', 'adjustable-bench']))
  assert.ok(!canDo(benchPress, ['dumbbells']))
  const pushdown = byId.get('triceps-pushdown') // needs a cable machine
  assert.ok(canDo(pushdown, ['cable-crossover']))
  // it is one way only: a flat bench cannot be set to an incline
  assert.ok(!canDo(byId.get('incline-dumbbell-press'), ['dumbbells', 'flat-bench']))
  assert.ok(canDo(byId.get('incline-dumbbell-press'), ['dumbbells', 'adjustable-bench']))
})

test('format: groups keep the list order, and picked names come out in list order', () => {
  const list = [
    { id: 'a', name: 'A', group: 'One' },
    { id: 'b', name: 'B', group: 'Two' },
    { id: 'c', name: 'C', group: 'One' },
  ]
  assert.deepEqual(groupBy(list).map((g) => [g.group, g.items.map((i) => i.id)]), [['One', ['a', 'c']], ['Two', ['b']]])
  assert.deepEqual(namesOf(list, ['c', 'a']), ['A', 'C'])
  assert.deepEqual(namesOf(list, []), [])
})

test('every equipment item has its own drawing in EquipmentIcon', () => {
  const source = readFileSync(new URL('../src/components/EquipmentIcon.tsx', import.meta.url), 'utf8')
  const drawn = new Set([...source.matchAll(/^ {2}'?([a-z-]+)'?: \(/gm)].map((m) => m[1]))
  for (const { id } of load('equipment')) assert.ok(drawn.has(id), `no drawing for "${id}"`)
  for (const id of drawn) assert.ok(load('equipment').some((e) => e.id === id), `drawing "${id}" has no equipment`)
})

test('combined days: groupsOf reads the new list, the old single group, and a rest day', () => {
  assert.deepEqual(groupsOf({ muscleGroup: 'chest', muscleGroups: ['chest', 'arms'] }), ['chest', 'arms'])
  assert.deepEqual(groupsOf({ muscleGroup: 'back' }), ['back']) // a row saved before combining existed
  assert.deepEqual(groupsOf({ muscleGroup: null }), [])
  assert.equal(groupsLabel(['chest']), 'Chest')
  assert.equal(groupsLabel(['chest', 'arms']), 'Chest and Arms')
  assert.equal(groupsLabel(['chest', 'back', 'arms']), 'Chest, Back and Arms')
})

test('combined days: exercises are shared between the groups, grouped by muscle, and a short group hands over its slots', () => {
  const two = recommendMix(exercises, ['chest', 'arms'], GYMS.full, 4)
  assert.equal(two.length, 4)
  assert.deepEqual(two.map((e) => e.muscleGroup), ['chest', 'chest', 'arms', 'arms'])
  const three = recommendMix(exercises, ['chest', 'back', 'arms'], GYMS.full, 5)
  assert.deepEqual(three.map((e) => e.muscleGroup), ['chest', 'chest', 'back', 'back', 'arms'])
  // One group is exactly the single-group recommender.
  assert.deepEqual(recommendMix(exercises, ['legs'], GYMS.full, 4).map((e) => e.id), recommend(exercises, 'legs', GYMS.full, 4).map((e) => e.id))
  // No equipment at all: still fills the plan from what exists, never an impossible pick or a duplicate.
  const bare = recommendMix(exercises, ['chest', 'core'], GYMS.none, 5)
  assert.ok(bare.every((e) => canDo(e, GYMS.none)))
  assert.equal(new Set(bare.map((e) => e.id)).size, bare.length)
  // The avoid list still applies in a mix.
  const first = two[0].id
  assert.ok(!recommendMix(exercises, ['chest', 'arms'], GYMS.full, 4, { avoidIds: [first], favoriteIds: [] }).some((e) => e.id === first))
})
