import { Pencil, Plus, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
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
import { useBodyLogs, useFinishedSessionCount, useProfile, useSettings } from '../hooks/useData'
import { bmi } from '../lib/bmi'
import { formatDate } from '../lib/dates'
import { heightParts, partsToText, weightParts } from '../lib/units'
import type { BodyLog, Profile as ProfileRow, Settings } from '../types'

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

function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card compact>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1 text-[28px] leading-none">{children}</div>
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
          <WeightChart logs={logs} unit={weightUnit} />
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
      </div>

      <Card>
        <SectionLabel>Weight history</SectionLabel>
        {logs.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted">No entries yet.</p>
        ) : (
          <ul className="mt-1.5">
            {[...logs].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center border-t border-border py-1">
                <span className="min-w-0 flex-1 text-[15px] font-semibold">{formatDate(entry.date, { weekday: true })}</span>
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

      <WeightSheet entry={editing} unit={weightUnit} onClose={() => setEditing(null)} />
      <StatsSheet open={statsOpen} profile={profile} unit={lengthUnit} onClose={() => setStatsOpen(false)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this entry?"
        message={
          deleting
            ? `${partsToText(weightParts(deleting.weightKg, weightUnit))} on ${formatDate(deleting.date, { weekday: true })} will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete entry"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
