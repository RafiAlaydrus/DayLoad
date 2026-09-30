// The ".ts" extension lets Node's test runner load this file directly.
import { isDateKey } from './dates.ts'

// Pure validation for backup files, so it can be tested without a browser.
// Reading and writing the database lives in src/db/backup.ts.

export const BACKUP_APP = 'dayload'
/** Must match the highest Dexie version() in src/db/db.ts. */
export const BACKUP_VERSION = 1

const MUSCLES = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'] as const

type Kind = 'string' | 'number' | 'array' | 'object' | 'date' | readonly string[]

/** The fields each row must have, and what type they must be. Extra fields are allowed. */
const TABLE_SHAPES = {
  profile: { id: 'number', age: 'number', heightCm: 'number' },
  bodyLogs: { date: 'date', weightKg: 'number' },
  goals: { type: ['weight', 'measurement'], target: 'number' },
  equipment: { id: 'string', name: 'string' },
  exercises: {
    id: 'string',
    name: 'string',
    muscleGroup: MUSCLES,
    equipmentIds: 'array',
    alternativeIds: 'array',
    howTo: 'object',
  },
  gyms: { id: 'string', name: 'string', equipmentIds: 'array' },
  timetable: { dayOfWeek: 'number' },
  sessions: { date: 'date', gymId: 'string', muscleGroup: MUSCLES },
  sets: { sessionId: 'number', exerciseId: 'string', reps: 'number', weightKg: 'number', order: 'number' },
  settings: {
    id: 'number',
    workoutMode: ['timetable', 'adaptive'],
    avoidIds: 'array',
    favoriteIds: 'array',
    weightUnit: ['kg', 'lb'],
    lengthUnit: ['cm', 'ftin'],
  },
} as const satisfies Record<string, Record<string, Kind>>

export type TableName = keyof typeof TABLE_SHAPES
export const TABLE_NAMES = Object.keys(TABLE_SHAPES) as TableName[]

type Row = Record<string, unknown>

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  tables: Record<TableName, Row[]>
}

export class BackupError extends Error {}

const isRecord = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v)

function fieldProblem(value: unknown, kind: Kind): boolean {
  if (typeof kind !== 'string') return typeof value !== 'string' || !kind.includes(value)
  switch (kind) {
    case 'number':
      return typeof value !== 'number' || !Number.isFinite(value)
    case 'string':
      return typeof value !== 'string' || value === ''
    case 'array':
      return !Array.isArray(value)
    case 'object':
      return !isRecord(value)
    case 'date':
      return typeof value !== 'string' || !isDateKey(value)
  }
}

/** Turns the text of a picked file into a Backup, or throws a BackupError with a message fit to show the user. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('This file is not valid JSON. Pick a backup file that DayLoad exported.')
  }
  if (!isRecord(data) || data.app !== BACKUP_APP || typeof data.version !== 'number' || !isRecord(data.tables)) {
    throw new BackupError('This is not a DayLoad backup file.')
  }
  if (data.version > BACKUP_VERSION) {
    throw new BackupError('This backup was made by a newer version of DayLoad. Update the app, then try again.')
  }

  for (const name of TABLE_NAMES) {
    const rows = data.tables[name]
    if (!Array.isArray(rows)) {
      throw new BackupError(`The backup is incomplete: its "${name}" data is missing.`)
    }
    const shape: Record<string, Kind> = TABLE_SHAPES[name]
    rows.forEach((row, i) => {
      if (!isRecord(row)) throw new BackupError(`The backup is damaged: "${name}" entry ${i + 1} is not a record.`)
      for (const [field, kind] of Object.entries(shape)) {
        if (fieldProblem(row[field], kind)) {
          throw new BackupError(`The backup is damaged: "${name}" entry ${i + 1} has a bad "${field}".`)
        }
      }
    })
  }

  return data as unknown as Backup
}

export function backupSummary(backup: Backup) {
  return {
    exportedAt: backup.exportedAt,
    weightEntries: backup.tables.bodyLogs.length,
    sessions: backup.tables.sessions.length,
  }
}
