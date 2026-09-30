import { ChevronLeft, Download, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FieldError } from '../components/ui/Field'
import { IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { Segmented } from '../components/ui/Segmented'
import { exportBackup, restoreBackup } from '../db/backup'
import { db } from '../db/db'
import { useSettings } from '../hooks/useData'
import { BackupError, backupSummary, parseBackup, type Backup } from '../lib/backup'
import { formatDate, toDateKey } from '../lib/dates'
import type { Settings as SettingsRow } from '../types'

export default function Settings() {
  const settings = useSettings()
  return (
    <>
      <div className="-ml-2.5 flex items-center gap-1">
        <IconLink to="/profile" label="Back to profile">
          <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        </IconLink>
        <h1 className="font-display text-[34px] font-bold leading-none">Settings</h1>
      </div>
      {settings ? <Units settings={settings} /> : <Loading className="h-[230px]" />}
      <BackupCard />
    </>
  )
}

function Units({ settings }: { settings: SettingsRow }) {
  const [error, setError] = useState('')

  async function save(patch: Partial<SettingsRow>) {
    setError('')
    try {
      // Only the display changes. Stored weights and heights stay in kg and cm.
      await db.settings.put({ ...settings, ...patch })
    } catch {
      setError('Could not save that setting. Try again.')
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <SectionLabel>Units</SectionLabel>
      <Segmented
        legend="Weight"
        name="weightUnit"
        value={settings.weightUnit}
        options={[
          { value: 'kg', label: 'kg' },
          { value: 'lb', label: 'lb' },
        ]}
        onChange={(weightUnit) => save({ weightUnit })}
      />
      <Segmented
        legend="Height"
        name="lengthUnit"
        value={settings.lengthUnit}
        options={[
          { value: 'cm', label: 'cm' },
          { value: 'ftin', label: 'ft / in' },
        ]}
        onChange={(lengthUnit) => save({ lengthUnit })}
      />
      {error && <FieldError>{error}</FieldError>}
    </Card>
  )
}

type Status = { kind: 'ok' | 'error'; text: string }

function BackupCard() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [busy, setBusy] = useState(false)

  async function onExport() {
    setBusy(true)
    setStatus(null)
    try {
      const result = await exportBackup()
      if (result === 'shared') setStatus({ kind: 'ok', text: 'Backup ready. Choose Save to Files to keep it somewhere safe.' })
      if (result === 'downloaded') setStatus({ kind: 'ok', text: 'Backup downloaded.' })
    } catch {
      setStatus({ kind: 'error', text: 'Could not create the backup. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so picking the same file again still fires a change.
    event.target.value = ''
    if (!file) return
    setStatus(null)
    try {
      setPending(parseBackup(await file.text()))
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error instanceof BackupError ? error.message : 'Could not read that file. Try picking it again.',
      })
    }
  }

  async function onRestore() {
    const backup = pending
    setPending(null)
    if (!backup) return
    setBusy(true)
    try {
      await restoreBackup(backup)
      const { weightEntries } = backupSummary(backup)
      setStatus({ kind: 'ok', text: `Backup restored, with ${weightEntries} weight ${weightEntries === 1 ? 'entry' : 'entries'}.` })
    } catch {
      setStatus({ kind: 'error', text: 'Could not restore that backup. Your current data was not changed.' })
    } finally {
      setBusy(false)
    }
  }

  const summary = pending && backupSummary(pending)
  const madeOn = summary && !Number.isNaN(Date.parse(summary.exportedAt)) ? formatDate(toDateKey(new Date(summary.exportedAt))) : null

  return (
    <Card>
      <SectionLabel>Backup</SectionLabel>
      <p className="mt-2 text-[15px] leading-relaxed">
        Your data is stored only on this phone. If you clear Safari data, delete the app or lose the phone, it is gone.
        Export a backup regularly and keep the file somewhere safe, such as iCloud Drive.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <Button onClick={onExport} disabled={busy}>
          <Download size={18} strokeWidth={2.4} aria-hidden="true" />
          Export backup
        </Button>
        <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
          <Upload size={18} strokeWidth={2.4} aria-hidden="true" />
          Import backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={onFile}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      </div>
      <div aria-live="polite">
        {status?.kind === 'error' && <FieldError>{status.text}</FieldError>}
        {status?.kind === 'ok' && <p className="mt-3 text-[13px] font-semibold">{status.text}</p>}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Replace your data?"
        message={
          summary
            ? `This backup${madeOn ? ` is from ${madeOn} and` : ''} has ${summary.weightEntries} weight ${summary.weightEntries === 1 ? 'entry' : 'entries'} and ${summary.sessions} ${summary.sessions === 1 ? 'session' : 'sessions'}. Importing it replaces everything on this phone. This cannot be undone.`
            : ''
        }
        confirmLabel="Replace data"
        onConfirm={onRestore}
        onCancel={() => setPending(null)}
      />
    </Card>
  )
}
