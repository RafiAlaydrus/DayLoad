import Dexie, { type Table } from 'dexie'
import type {
  BodyLog,
  CardioSession,
  Equipment,
  Exercise,
  Goal,
  Gym,
  Profile,
  Session,
  Settings,
  TimetableDay,
  WorkoutSet,
} from '../types'
import { migrateToV2 } from '../lib/migrate'
import { SEED_EQUIPMENT, SEED_EXERCISES, seed } from './seed'

export class DayLoadDB extends Dexie {
  profile!: Table<Profile, number>
  bodyLogs!: Table<BodyLog, number>
  goals!: Table<Goal, number>
  equipment!: Table<Equipment, string>
  exercises!: Table<Exercise, string>
  gyms!: Table<Gym, string>
  timetable!: Table<TimetableDay, number>
  sessions!: Table<Session, number>
  sets!: Table<WorkoutSet, number>
  settings!: Table<Settings, number>
  cardio!: Table<CardioSession, number>

  constructor() {
    super('dayload')
    // Never edit a released version. Add a new version() with the changed stores (and an
    // .upgrade() if data must change) so existing phones keep their data.
    this.version(1).stores({
      profile: 'id',
      bodyLogs: '++id, date',
      goals: '++id, type',
      equipment: 'id',
      exercises: 'id, muscleGroup',
      gyms: 'id',
      timetable: 'dayOfWeek',
      sessions: '++id, date, gymId, muscleGroup',
      sets: '++id, sessionId, exerciseId',
      settings: 'id',
    })
    // Version 2 changed data, not tables: the built-in equipment (now 40 items in groups) and
    // exercise lists were replaced. Runs only on phones that already had version 1; a brand-new
    // database is seeded directly (populate) and skips upgrades. It runs in one transaction, so
    // it either fully applies or leaves the phone exactly as it was.
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        const next = migrateToV2(
          { exercises: await tx.table('exercises').toArray(), gyms: await tx.table('gyms').toArray() },
          { equipment: SEED_EQUIPMENT, exercises: SEED_EXERCISES },
        )
        await tx.table('equipment').clear()
        await tx.table('equipment').bulkAdd(next.equipment)
        await tx.table('exercises').clear()
        await tx.table('exercises').bulkAdd(next.exercises)
        await tx.table('gyms').bulkPut(next.gyms)
      })
    // Version 3 adds cardio sessions. A new table only: nothing existing changes, so there is no upgrade step.
    this.version(3).stores({ cardio: '++id, date' })
    // Runs once, when the database is first created.
    this.on('populate', seed)
  }
}

export const db = new DayLoadDB()
