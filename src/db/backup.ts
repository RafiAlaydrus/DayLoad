import { BACKUP_APP, BACKUP_VERSION, TABLE_NAMES, type Backup } from '../lib/backup'
import { todayKey } from '../lib/dates'
import { db } from './db'

export async function buildBackup(): Promise<Backup> {
  const tables = {} as Backup['tables']
  // One read transaction so every table comes from the same moment.
  await db.transaction('r', db.tables, async () => {
    for (const name of TABLE_NAMES) tables[name] = await db.table(name).toArray()
  })
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables }
}

/**
 * Replaces everything with the backup, all or nothing: if any write fails the
 * transaction rolls back and the current data is untouched.
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) {
      const table = db.table(name)
      await table.clear()
      await table.bulkPut(backup.tables[name])
    }
  })
}

export type ExportResult = 'shared' | 'downloaded' | 'cancelled'

/**
 * iPhone: opens the share sheet (Save to Files, AirDrop, Mail...), because a plain
 * file download is unreliable in an installed home-screen app. Anywhere the share
 * sheet can't take a file (a desktop browser), it falls back to a normal download.
 */
export async function exportBackup(): Promise<ExportResult> {
  const backup = await buildBackup()
  const file = new File([JSON.stringify(backup, null, 2)], `dayload-backup-${todayKey()}.json`, {
    type: 'application/json',
  })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'DayLoad backup' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Share refused for another reason (for example the tap was too long ago): download instead.
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
