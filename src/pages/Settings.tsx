import { ChevronLeft, Download, Upload, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FieldError } from '../components/ui/Field'
import { IconButton, IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { Segmented } from '../components/ui/Segmented'
import { exportBackup, restoreBackup } from '../db/backup'
import { db } from '../db/db'
import { toggleExercisePref } from '../db/prefs'
import { useExercises, useSettings } from '../hooks/useData'
import { REST_AFTER_DAYS } from '../lib/adaptive'
import { BackupError, backupSummary, parseBackup, type Backup } from '../lib/backup'
import { formatDate, toDateKey } from '../lib/dates'
import type { Pref } from '../lib/recommend'
import type { Exercise, Settings as SettingsRow, ThemePref, WorkoutMode } from '../types'

export default function Settings() {
  const settings = useSettings()
  const exercises = useExercises()
  return (
    <>
      <div className="-ml-2.5 flex items-center gap-1">
        <IconLink to="/profile" label="Back to profile">
          <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
        </IconLink>
        <h1 className="font-display text-[34px] font-bold leading-none">Settings</h1>
      </div>
      {settings ? <Mode settings={settings} /> : <Loading className="h-[190px]" />}
      {settings ? <Appearance settings={settings} /> : <Loading className="h-[140px]" />}
      {settings ? <Units settings={settings} /> : <Loading className="h-[230px]" />}
      {settings && exercises ? (
        <>
          <PrefList pref="favorite" ids={settings.favoriteIds} exercises={exercises} />
          <PrefList pref="avoid" ids={settings.avoidIds} exercises={exercises} />
        </>
      ) : (
        <Loading className="h-[140px]" />
      )}
      <BackupCard />
    </>
  )
}

/** Saves a change to the settings row, and holds the error to show if it failed. */
function useSave(settings: SettingsRow) {
  const [error, setError] = useState('')
  async function save(patch: Partial<SettingsRow>) {
    setError('')
    try {
      await db.settings.put({ ...settings, ...patch })
    } catch {
      setError('Could not save that setting. Try again.')
    }
  }
  return { save, error }
}

function Mode({ settings }: { settings: SettingsRow }) {
  const { save, error } = useSave(settings)
  return (
    <Card className="flex flex-col gap-4">
      <SectionLabel>Workout mode</SectionLabel>
      <Segmented<WorkoutMode>
        legend="Choose the muscle group by"
        hideLegend
        name="workoutMode"
        value={settings.workoutMode}
        options={[
          { value: 'timetable', label: 'Timetable' },
          { value: 'adaptive', label: 'Adaptive' },
        ]}
        onChange={(workoutMode) => save({ workoutMode })}
      />
      <p className="text-[13px] leading-relaxed text-muted">
        {settings.workoutMode === 'adaptive'
          ? 'Picks the muscle group you trained longest ago. You can always train something else.'
          : 'Follows your weekly timetable, which you set on the Plan tab. A weekday you leave unset means you pick the muscle group that day.'}{' '}
        In both modes, a rest day is suggested after {REST_AFTER_DAYS} training days in a row.
      </p>
      {error && <FieldError>{error}</FieldError>}
    </Card>
  )
}

const THEME_HELP: Record<ThemePref, string> = {
  system: 'Follows the light or dark setting of your iPhone.',
  light: 'Warm off-white, always.',
  dark: 'Warm charcoal, always.',
}

/** Dark, Light, or follow the phone. ThemeSync applies the choice, so changing it here is all it takes. */
function Appearance({ settings }: { settings: SettingsRow }) {
  const { save, error } = useSave(settings)
  const theme = settings.theme ?? 'system'
  return (
    <Card className="flex flex-col gap-4">
      <SectionLabel>Appearance</SectionLabel>
      <Segmented<ThemePref>
        legend="Theme"
        hideLegend
        name="theme"
        value={theme}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        onChange={(next) => save({ theme: next })}
      />
      <p className="text-[13px] leading-relaxed text-muted">{THEME_HELP[theme]}</p>
      {error && <FieldError>{error}</FieldError>}
    </Card>
  )
}

const PREF_COPY: Record<Pref, { title: string; empty: string }> = {
  favorite: {
    title: 'Favorites',
    empty: 'None yet. Favorite an exercise on its page and it is picked first when a workout is built.',
  },
  avoid: {
    title: 'Avoid list',
    empty: 'None yet. Avoid an exercise on its page and it is never suggested or offered as a swap.',
  },
}

/** The exercises marked as favorite or avoided, each with a button to take it off the list. */
function PrefList({ pref, ids, exercises }: { pref: Pref; ids: string[]; exercises: Exercise[] }) {
  const [error, setError] = useState('')
  const { title, empty } = PREF_COPY[pref]
  // In the library's order. An id that is no longer in the library is skipped.
  const listed = exercises.filter((e) => ids.includes(e.id))

  async function remove(id: string) {
    setError('')
    try {
      await toggleExercisePref(id, pref)
    } catch {
      setError('Could not save that. Try again.')
    }
  }

  return (
    <Card>
      <SectionLabel>{title}</SectionLabel>
      {listed.length === 0 ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{empty}</p>
      ) : (
        <ul className="mt-1.5">
          {listed.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 border-t border-border">
              <span className="min-w-0 py-2 text-[15px] font-semibold">{e.name}</span>
              <IconButton label={`Remove ${e.name} from ${title.toLowerCase()}`} className="-mr-2.5" onClick={() => remove(e.id)}>
                <X size={20} strokeWidth={2} aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      {error && <FieldError>{error}</FieldError>}
    </Card>
  )
}

function Units({ settings }: { settings: SettingsRow }) {
  // Only the display changes. Stored weights and heights stay in kg and cm.
  const { save, error } = useSave(settings)

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
