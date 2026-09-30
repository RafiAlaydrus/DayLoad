import Dexie, { type Table } from 'dexie'
import type {
  BodyLog,
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
import { seed } from './seed'

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

  constructor() {
    super('dayload')
    // Never edit a released version. Add version(2) with the new stores (and an
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
    // Runs once, when the database is first created.
    this.on('populate', seed)
  }
}

export const db = new DayLoadDB()
