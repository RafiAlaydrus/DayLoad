import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'))
const equipment = load('equipment')
const exercises = load('exercises')

const GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
const equipmentIds = new Set(equipment.map((e) => e.id))
const exerciseById = new Map(exercises.map((e) => [e.id, e]))

test('ids are unique and there are at least 50 exercises', () => {
  assert.equal(equipmentIds.size, equipment.length, 'duplicate equipment id')
  assert.equal(exerciseById.size, exercises.length, 'duplicate exercise id')
  assert.ok(exercises.length >= 50, `got ${exercises.length} exercises`)
})

// The owner's list, in the owner's order and groups. If this changes, change it on purpose.
const OWNER_LIST = {
  'Free weights': ['Barbell', 'EZ curl bar', 'Dumbbells', 'Kettlebells', 'Weight plates'],
  'Benches and racks': ['Flat bench', 'Adjustable bench', 'Preacher curl bench', 'Hyperextension bench', 'Squat rack / power rack', 'Smith machine'],
  Bodyweight: ['Pull-up bar', 'Dip bars'],
  Cable: ['Cable machine', 'Cable crossover', 'Lat pulldown', 'Seated cable row'],
  'Upper body machines': ['Chest press machine', 'Pec deck', 'Shoulder press machine', 'Lateral raise machine', 'Rear delt machine', 'Assisted pull-up/dip machine', 'Seated row machine', 'T-bar row', 'Bicep curl machine', 'Tricep extension machine'],
  'Lower body machines': ['Leg press', 'Hack squat', 'Leg extension', 'Leg curl', 'Hip thrust machine', 'Hip abductor', 'Hip adductor', 'Calf raise machine'],
  'Core and accessories': ['Ab crunch machine', 'Ab wheel', 'Resistance bands', 'Medicine ball', 'Stability ball'],
}

test('equipment is the owner\'s 40 items, in their groups and order', () => {
  const actual = {}
  for (const e of equipment) (actual[e.group] ??= []).push(e.name)
  assert.deepEqual(actual, OWNER_LIST)
  assert.deepEqual(Object.keys(actual), Object.keys(OWNER_LIST), 'group order')
  assert.equal(equipment.length, 40)
})

test('every exercise is well formed and points at real ids', () => {
  for (const e of exercises) {
    const at = `exercise "${e.id}"`
    assert.match(e.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${at}: id must be kebab-case`)
    assert.ok(e.name?.trim(), `${at}: missing name`)
    assert.ok(GROUPS.includes(e.muscleGroup), `${at}: bad muscleGroup ${e.muscleGroup}`)

    assert.equal(new Set(e.equipmentIds).size, e.equipmentIds.length, `${at}: duplicate equipment`)
    for (const id of e.equipmentIds) assert.ok(equipmentIds.has(id), `${at}: unknown equipment "${id}"`)

    assert.ok(e.alternativeIds.length >= 1, `${at}: needs at least one alternative`)
    for (const id of e.alternativeIds) {
      const alt = exerciseById.get(id)
      assert.ok(alt, `${at}: unknown alternative "${id}"`)
      assert.notEqual(id, e.id, `${at}: lists itself as an alternative`)
      assert.equal(alt.muscleGroup, e.muscleGroup, `${at}: alternative "${id}" is a different muscle group`)
    }

    const { targetMuscles, cues, mistakes } = e.howTo
    assert.ok(targetMuscles.length >= 1, `${at}: needs target muscles`)
    assert.ok(cues.length >= 2 && cues.length <= 3, `${at}: needs 2 to 3 cues, has ${cues.length}`)
    assert.ok(mistakes.length >= 1 && mistakes.length <= 2, `${at}: needs 1 to 2 mistakes, has ${mistakes.length}`)
  }
})

test('every muscle group has at least two bodyweight exercises (No equipment always works)', () => {
  for (const g of GROUPS) {
    const bodyweight = exercises.filter((e) => e.muscleGroup === g && e.equipmentIds.length === 0)
    assert.ok(bodyweight.length >= 2, `${g}: only ${bodyweight.length} bodyweight exercise(s)`)
  }
})

test('every equipment item is used by at least one exercise', () => {
  for (const eq of equipment) {
    assert.ok(
      exercises.some((e) => e.equipmentIds.includes(eq.id)),
      `equipment "${eq.id}" is not used by any exercise, so ticking it at a gym would change nothing`,
    )
  }
})

test('no em dashes in seed text (antislop R-02)', () => {
  assert.ok(!JSON.stringify([equipment, exercises]).includes(String.fromCharCode(0x2014)))
})
