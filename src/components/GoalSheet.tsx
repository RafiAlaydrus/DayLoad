import { useState, type FormEvent } from 'react'
import { db } from '../db/db'
import { addDays, todayKey } from '../lib/dates'
import { readings, thingLabel, thingOf, THINGS, valueText, type Thing, type Units } from '../lib/goals'
import { measurementText, measurementUnit } from '../lib/units'
import { validateDeadline, validateGoalTarget, weightInputFrom } from '../lib/validate'
import type { BodyLog, Goal } from '../types'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Field, FieldError } from './ui/Field'
import { Segmented } from './ui/Segmented'

interface Props {
  /** "new" starts a goal, a thing edits its goal, null keeps the sheet closed. */
  editing: Thing | 'new' | null
  goals: Goal[]
  logs: BodyLog[]
  units: Units
  onClose: () => void
}

export function GoalSheet({ editing, goals, logs, units, onClose }: Props) {
  return (
    <BottomSheet open={editing !== null} onClose={onClose} title={editing === 'new' ? 'Set a goal' : 'Edit goal'}>
      {editing && (
        <GoalForm
          existing={editing === 'new' ? undefined : goals.find((g) => thingOf(g) === editing)}
          taken={new Set(goals.map(thingOf))}
          logs={logs}
          units={units}
          onDone={onClose}
        />
      )}
    </BottomSheet>
  )
}

function GoalForm({ existing, taken, logs, units, onDone }: { existing?: Goal; taken: Set<Thing>; logs: BodyLog[]; units: Units; onDone: () => void }) {
  const choices = THINGS.filter((t) => !taken.has(t.id))
  const [thing, setThing] = useState<Thing>(existing ? thingOf(existing) : (choices[0]?.id ?? 'weight'))
  const [target, setTarget] = useState(() => {
    if (!existing) return ''
    return thingOf(existing) === 'weight' ? weightInputFrom(existing.target, units.weight) : measurementText(existing.target, units.length)
  })
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [errors, setErrors] = useState<{ target?: string; deadline?: string }>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const label = thingLabel(thing)
  // Progress is measured from your latest value of this thing, or from where the goal started if it is being edited.
  const latest = readings(logs, thing).at(-1)
  const start = existing?.start ?? latest?.value
  const startDate = existing?.startDate ?? latest?.date
  const suffix = thing === 'weight' ? units.weight : measurementUnit(units.length)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const t = validateGoalTarget(thing, units, target)
    const d = validateDeadline(deadline)
    let targetError = t.error
    if (!targetError && start === undefined) targetError = `Log your ${label.toLowerCase()} first, so progress has a starting point.`
    else if (!targetError && Math.abs(t.value! - start!) < 1e-6) targetError = 'That is where you are now. Pick a different target.'
    setErrors({ target: targetError, deadline: d.error })
    if (targetError || d.error !== undefined) return

    setSaving(true)
    setSaveError('')
    try {
      const goal: Goal = {
        ...existing,
        type: thing === 'weight' ? 'weight' : 'measurement',
        target: t.value!,
        start,
        startDate,
      }
      if (thing === 'weight') delete goal.measurement
      else goal.measurement = thing
      if (d.value) goal.deadline = d.value
      else delete goal.deadline
      await db.goals.put(goal)
      onDone()
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {!existing && (
        <Segmented<Thing>
          legend="What is the goal for?"
          wrap
          name="goalThing"
          value={thing}
          options={choices.map((c) => ({ value: c.id, label: c.label }))}
          onChange={(v) => {
            setThing(v)
            setTarget('')
            setErrors({})
          }}
        />
      )}

      <p className="text-[13px] leading-relaxed text-muted">
        {start !== undefined
          ? `${existing ? 'It started from' : 'You start from your latest'} ${label.toLowerCase()}: ${valueText(thing, start, units)}.`
          : `You have not logged a ${label.toLowerCase()} yet. Log it with a weigh-in first.`}
      </p>

      <Field
        label={`Target ${label.toLowerCase()}`}
        suffix={suffix}
        inputMode="decimal"
        autoComplete="off"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        error={errors.target}
      />
      <div>
        <Field
          label="Deadline, optional"
          type="date"
          min={addDays(todayKey(), 1)}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          error={errors.deadline}
        />
        {deadline && (
          <button type="button" onClick={() => setDeadline('')} className="press mt-1 -ml-2 min-h-11 px-2 text-[13px] font-bold text-ink underline">
            Clear deadline
          </button>
        )}
      </div>

      {saveError && <FieldError>{saveError}</FieldError>}
      <Button type="submit" disabled={saving} className="mt-1">
        {existing ? 'Save changes' : 'Save goal'}
      </Button>
    </form>
  )
}
