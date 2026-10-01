import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { db } from '../db/db'
import { daysBetween, formatDate, todayKey } from '../lib/dates'
import { goalProgress, readings, remaining, thingLabel, thingOf, THINGS, valueText, type Thing, type Units } from '../lib/goals'
import { measurementUnit } from '../lib/units'
import type { BodyLog, Goal } from '../types'
import { GoalSheet } from './GoalSheet'
import { Button } from './ui/Button'
import { Card, SectionLabel } from './ui/Card'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { FieldError } from './ui/Field'
import { IconButton } from './ui/IconButton'
import { Loading } from './ui/Loading'

/** The goals, each with a progress bar from where you started to the target. At most one per thing (weight, waist...). */
export function GoalsCard({ goals, logs, units }: { goals: Goal[] | undefined; logs: BodyLog[]; units: Units }) {
  const [editing, setEditing] = useState<Thing | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Goal | null>(null)
  const [error, setError] = useState('')

  if (!goals) return <Loading className="h-[140px]" />

  const have = new Set(goals.map(thingOf))
  const canAdd = THINGS.some((t) => !have.has(t.id))
  // Weight first, then the measurements in the app's order.
  const listed = [...goals].sort((a, b) => THINGS.findIndex((t) => t.id === thingOf(a)) - THINGS.findIndex((t) => t.id === thingOf(b)))

  async function remove() {
    const goal = deleting
    setDeleting(null)
    if (goal?.id === undefined) return
    setError('')
    try {
      await db.goals.delete(goal.id)
    } catch {
      setError('Could not delete that goal. Try again.')
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>Goals</SectionLabel>
        {canAdd && (
          <Button size="sm" variant="secondary" onClick={() => setEditing('new')}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
            Add goal
          </Button>
        )}
      </div>

      {listed.length === 0 ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          No goals yet. Set a target weight or measurement and your progress shows here.
        </p>
      ) : (
        <ul className="mt-1.5">
          {listed.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              logs={logs}
              units={units}
              onEdit={() => setEditing(thingOf(goal))}
              onDelete={() => setDeleting(goal)}
            />
          ))}
        </ul>
      )}
      {error && <FieldError>{error}</FieldError>}

      <GoalSheet editing={editing} goals={goals} logs={logs} units={units} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this goal?"
        message={
          deleting
            ? `Your ${thingLabel(thingOf(deleting)).toLowerCase()} goal is removed. Your logged weights and measurements stay.`
            : ''
        }
        confirmLabel="Delete goal"
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  )
}

function GoalRow({ goal, logs, units, onEdit, onDelete }: { goal: Goal; logs: BodyLog[]; units: Units; onEdit: () => void; onDelete: () => void }) {
  const thing = thingOf(goal)
  const label = thingLabel(thing)
  const list = readings(logs, thing)
  const current = list.at(-1)
  // A goal imported without a start falls back to the first value logged.
  const start = goal.start ?? list[0]?.value
  const startDate = goal.startDate ?? list[0]?.date
  const progress = current && start !== undefined ? goalProgress(start, current.value, goal.target) : null
  const pct = progress ? Math.round(progress.fraction * 100) : 0
  const daysLeft = goal.deadline ? daysBetween(todayKey(), goal.deadline) : null

  return (
    <li className="border-t border-border py-3.5 first:border-t-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold">{label}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {current ? `Now ${valueText(thing, current.value, units)}, ` : ''}target {valueText(thing, goal.target, units)}
          </p>
        </div>
        <div className="-mr-2.5 flex shrink-0">
          <IconButton label={`Edit ${label.toLowerCase()} goal`} onClick={onEdit}>
            <Pencil size={18} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${label.toLowerCase()} goal`} onClick={onDelete}>
            <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {progress && current ? (
        <>
          <div
            role="progressbar"
            aria-label={`${label} goal progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-1.5 h-1.5 rounded-full bg-border"
          >
            <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-[13px] leading-relaxed">
            <span className="font-bold">
              {progress.reached
                ? 'Goal reached'
                : `${remaining(thing, current.value, goal.target, units)} ${thing === 'weight' ? units.weight : measurementUnit(units.length)} to go`}
            </span>
            <span className="text-muted">
              {start !== undefined && startDate ? ` · From ${valueText(thing, start, units)} on ${formatDate(startDate)}` : ''}
            </span>
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">Log your {label.toLowerCase()} to see progress.</p>
      )}

      {daysLeft !== null && goal.deadline && (
        <p className="mt-0.5 text-[13px] text-muted">
          Deadline {formatDate(goal.deadline)}
          {daysLeft > 0 ? `, ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left` : daysLeft === 0 ? ', today' : ', passed'}
        </p>
      )}
    </li>
  )
}
