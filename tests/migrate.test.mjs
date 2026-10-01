import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { BackupError, parseBackup } from '../src/lib/backup.ts'
import { migrateToV2, remapEquipmentIds } from '../src/lib/migrate.ts'

const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'))
const seed = { equipment: load('equipment'), exercises: load('exercises').map((e) => ({ ...e, isCustom: false })) }

// What a phone running data version 1 has: the old 21-item list and old ids.
const oldExercise = { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'chest', equipmentIds: ['barbell', 'flat-bench'], alternativeIds: [], howTo: {}, isCustom: false }
const customExercise = { id: 'my-move', name: 'My Move', muscleGroup: 'chest', equipmentIds: ['incline-bench', 'dumbbells'], alternativeIds: [], howTo: {}, isCustom: true }
const gyms = [
  { id: 'no-equipment', name: 'No equipment', equipmentIds: [], isTemporary: false, isBuiltIn: true },
  { id: 'condo', name: 'Condo gym', equipmentIds: ['dumbbells', 'flat-bench', 'incline-bench', 'pull-up-bar'], isTemporary: false, isBuiltIn: false },
  { id: 'main', name: 'Main gym', equipmentIds: ['barbell', 'pec-deck', 'cable-machine'], isTemporary: false, isBuiltIn: false },
]

test('remapEquipmentIds: renamed and split ids are translated, the rest untouched, no duplicates', () => {
  assert.deepEqual(remapEquipmentIds(['dumbbells', 'incline-bench']), ['dumbbells', 'adjustable-bench'])
  assert.deepEqual(remapEquipmentIds(['pec-deck']), ['pec-deck', 'rear-delt-machine'])
  assert.deepEqual(remapEquipmentIds(['adjustable-bench', 'incline-bench']), ['adjustable-bench'])
  assert.deepEqual(remapEquipmentIds([]), [])
  assert.deepEqual(remapEquipmentIds(undefined), [])
})

test('migrateToV2: built-ins are refreshed, custom exercises and every gym are kept and translated', () => {
  const out = migrateToV2({ exercises: [oldExercise, customExercise], gyms }, seed)
  assert.equal(out.equipment.length, 40)
  assert.equal(out.exercises.filter((e) => !e.isCustom).length, seed.exercises.length)
  const kept = out.exercises.find((e) => e.id === 'my-move')
  assert.deepEqual(kept.equipmentIds, ['adjustable-bench', 'dumbbells'])
  assert.equal(out.gyms.length, 3)
  assert.deepEqual(out.gyms.find((g) => g.id === 'condo').equipmentIds, ['dumbbells', 'flat-bench', 'adjustable-bench', 'pull-up-bar'])
  assert.deepEqual(out.gyms.find((g) => g.id === 'main').equipmentIds, ['barbell', 'pec-deck', 'rear-delt-machine', 'cable-machine'])
  assert.deepEqual(out.gyms.find((g) => g.id === 'no-equipment').equipmentIds, [])
  // nothing the migration writes points at an id that no longer exists
  const ids = new Set(out.equipment.map((e) => e.id))
  for (const g of out.gyms) for (const id of g.equipmentIds) assert.ok(ids.has(id), `gym ${g.id}: ${id}`)
  for (const e of out.exercises) for (const id of e.equipmentIds) assert.ok(ids.has(id), `exercise ${e.id}: ${id}`)
})

test('migrateToV2 does not mutate its input (a failed upgrade must leave data as it was)', () => {
  const before = JSON.stringify({ exercises: [oldExercise, customExercise], gyms })
  migrateToV2({ exercises: [oldExercise, customExercise], gyms }, seed)
  assert.equal(JSON.stringify({ exercises: [oldExercise, customExercise], gyms }), before)
})

test('backup: files from data version 1, 2 and 3 are accepted, a newer one is not', () => {
  const file = (version) => JSON.stringify({
    app: 'dayload', version, exportedAt: '2026-09-30T12:00:00.000Z',
    tables: { profile: [], bodyLogs: [], goals: [], equipment: [], exercises: [], gyms: [], timetable: [], sessions: [], sets: [], settings: [] },
  })
  assert.equal(parseBackup(file(1)).version, 1)
  assert.equal(parseBackup(file(2)).version, 2)
  // Version 3 added cardio: an older file has no such table, and imports as no cardio history.
  assert.deepEqual(parseBackup(file(2)).tables.cardio, [])
  assert.throws(() => parseBackup(file(4)), (e) => e instanceof BackupError && /newer version/.test(e.message))
})
