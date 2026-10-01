import { Pencil, Plus, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { GoalsCard } from '../components/GoalsCard'
import { Onboarding } from '../components/Onboarding'
import { StatsSheet } from '../components/StatsSheet'
import { WeightChart } from '../components/WeightChart'
import { WeightSheet } from '../components/WeightSheet'
import { Button } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FieldError } from '../components/ui/Field'
import { IconButton, IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { Measure } from '../components/ui/Measure'
import { db } from '../db/db'
import { useBodyLogs, useExercises, useFinishedSessionCount, useGoals, useHistory, useProfile, useSettings } from '../hooks/useData'
import { bmi } from '../lib/bmi'
import { formatDate } from '../lib/dates'
import { changeSinceFirst, changeText, MEASUREMENTS, measurementLine, readings } from '../lib/goals'
import { bestText, personalRecords } from '../lib/progress'
import { heightParts, measurementParts, partsToText, weightParts } from '../lib/units'
import type { BodyLog, Profile as ProfileRow, Settings, WeightUnit } from '../types'

export default function Profile() {
  const profile = useProfile()
  const logs = useBodyLogs()
  const settings = useSettings()

  if (profile === undefined || logs === undefined || settings === undefined) {
    return (
      <>
        <Loading className="h-11" />
        <Loading className="h-[290px]" />
      </>
    )
  }
  if (profile === null) return <Onboarding settings={settings} />
  return <ProfileView profile={profile} logs={logs} settings={settings} />
}

function StatCard({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <Card compact>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1 text-[28px] leading-none">{children}</div>
      {note && <p className="mt-1.5 text-xs leading-snug text-muted">{note}</p>}
    </Card>
  )
}

const RECORDS_SHOWN = 5

/** The best set for each exercise. Own loading state, so the weight card never waits for workout history. */
function Records({ unit }: { unit: WeightUnit }) {
  const history = useHistory()
  const exercises = useExercises()
  const [all, setAll] = useState(false)

  if (!history || !exercises) return <Loading className="h-[150px]" />

  const records = personalRecords(history)
  const name = new Map(exercises.map((e) => [e.id, e.name]))
  const shown = all ? records : records.slice(0, RECORDS_SHOWN)

  return (
    <Card>
      <SectionLabel>Personal records</SectionLabel>
      {records.length === 0 ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          No records yet. Finish a workout and your best set for each exercise shows up here.
        </p>
      ) : (
        <>
          <ul className="mt-1.5">
            {shown.map((r) => (
              <li key={r.exerciseId} className="flex items-baseline justify-between gap-3 border-t border-border py-3">
                <span className="min-w-0 text-[15px] font-semibold">{name.get(r.exerciseId) ?? 'Removed exercise'}</span>
                <span className="shrink-0 text-[15px] font-semibold text-muted">{bestText(r, unit)}</span>
              </li>
            ))}
          </ul>
          {records.length > RECORDS_SHOWN && (
            <button
              type="button"
              onClick={() => setAll(!all)}
              aria-expanded={all}
              className="press -ml-2 mt-1 min-h-11 px-2 text-[13px] font-bold text-ink underline"
            >
              {all ? 'Show fewer' : `Show all ${records.length}`}
            </button>
          )}
        </>
      )}
    </Card>
  )
}

function ProfileView({ profile, logs, settings }: { profile: ProfileRow; logs: BodyLog[]; settings: Settings }) {
  const { weightUnit, lengthUnit } = settings
  const [editing, setEditing] = useState<BodyLog | 'new' | null>(null)
  const [deleting, setDeleting] = useState<BodyLog | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const latest = logs.at(-1)
  const sessionCount = useFinishedSessionCount()
  const goals = useGoals()
  const weightGoal = goals?.find((g) => g.type === 'weight')
  const units = { weight: weightUnit, length: lengthUnit }

  async function confirmDelete() {
    const entry = deleting
    setDeleting(null)
    if (entry?.id === undefined) return
    setDeleteError('')
    try {
      await db.bodyLogs.delete(entry.id)
    } catch {
      setDeleteError('Could not delete that entry. Try again.')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[34px] font-bold leading-none">Profile</h1>
        <div className="-mr-2.5 flex items-center">
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="press min-h-11 px-2 text-[13px] font-semibold text-muted"
          >
            Edit stats
          </button>
          <IconLink to="/profile/settings" label="Settings">
            <SettingsIcon size={22} strokeWidth={2} aria-hidden="true" />
          </IconLink>
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Weight</SectionLabel>
            {latest ? (
              <Measure parts={weightParts(latest.weightKg, weightUnit)} className="mt-1.5 block text-[44px] leading-none" />
            ) : (
              <p className="mt-2 text-[15px] font-semibold">No weight logged yet</p>
            )}
          </div>
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
            Log weight
          </Button>
        </div>
        {logs.length > 0 ? (
          <WeightChart logs={logs} unit={weightUnit} targetKg={weightGoal?.target} />
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">Your trend line appears here after your first entry.</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {latest && (
          <StatCard label="BMI">
            <span className="font-display font-bold">{bmi(latest.weightKg, profile.heightCm).toFixed(1)}</span>
          </StatCard>
        )}
        <StatCard label="Height">
          <Measure parts={heightParts(profile.heightCm, lengthUnit)} />
        </StatCard>
        <StatCard label="Age">
          <span className="font-display font-bold">{profile.age}</span>
        </StatCard>
        {sessionCount !== undefined && (
          <StatCard label="Sessions">
            <span className="font-display font-bold">{sessionCount}</span>
          </StatCard>
        )}
        {/* One card for each measurement that has been logged, with how far it moved since the first entry. */}
        {MEASUREMENTS.map(({ id, label }) => {
          const list = readings(logs, id)
          const newest = list.at(-1)
          if (!newest) return null
          const change = changeSinceFirst(list, lengthUnit)
          return (
            <StatCard key={id} label={label} note={change ? changeText(change, lengthUnit) : undefined}>
              <Measure parts={measurementParts(newest.value, lengthUnit)} />
            </StatCard>
          )
        })}
      </div>

      <GoalsCard goals={goals} logs={logs} units={units} />

      <Records unit={weightUnit} />

      <Card>
        <SectionLabel>Weight history</SectionLabel>
        {logs.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted">No entries yet.</p>
        ) : (
          <ul className="mt-1.5">
            {[...logs].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center border-t border-border py-1">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{formatDate(entry.date, { weekday: true })}</span>
                  {measurementLine(entry, lengthUnit) && (
                    <span className="block text-xs leading-snug text-muted">{measurementLine(entry, lengthUnit)}</span>
                  )}
                </span>
                <Measure parts={weightParts(entry.weightKg, weightUnit)} className="text-[22px]" />
                <IconButton label={`Edit weight from ${formatDate(entry.date)}`} className="ml-1" onClick={() => setEditing(entry)}>
                  <Pencil size={18} strokeWidth={2} aria-hidden="true" />
                </IconButton>
                <IconButton label={`Delete weight from ${formatDate(entry.date)}`} onClick={() => setDeleting(entry)}>
                  <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        {deleteError && <FieldError>{deleteError}</FieldError>}
      </Card>

      <WeightSheet entry={editing} unit={weightUnit} lengthUnit={lengthUnit} onClose={() => setEditing(null)} />
      <StatsSheet open={statsOpen} profile={profile} unit={lengthUnit} onClose={() => setStatsOpen(false)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this entry?"
        message={
          deleting
            ? `${partsToText(weightParts(deleting.weightKg, weightUnit))}${measurementLine(deleting, lengthUnit) ? ' and its measurements' : ''} on ${formatDate(deleting.date, { weekday: true })} will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete entry"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
