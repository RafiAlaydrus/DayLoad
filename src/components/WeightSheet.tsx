import { useState, type FormEvent } from 'react'
import { db } from '../db/db'
import { todayKey } from '../lib/dates'
import { validateDate, validateWeight, weightInputFrom } from '../lib/validate'
import type { BodyLog, WeightUnit } from '../types'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Field, FieldError } from './ui/Field'

interface Props {
  /** "new" logs a fresh weight, an entry edits that entry, null keeps the sheet closed. */
  entry: BodyLog | 'new' | null
  unit: WeightUnit
  onClose: () => void
}

export function WeightSheet({ entry, unit, onClose }: Props) {
  return (
    <BottomSheet open={entry !== null} onClose={onClose} title={entry === 'new' ? 'Log weight' : 'Edit weight'}>
      {entry && <WeightForm existing={entry === 'new' ? undefined : entry} unit={unit} onDone={onClose} />}
    </BottomSheet>
  )
}

function WeightForm({ existing, unit, onDone }: { existing?: BodyLog; unit: WeightUnit; onDone: () => void }) {
  const [weight, setWeight] = useState(existing ? weightInputFrom(existing.weightKg, unit) : '')
  const [date, setDate] = useState(existing?.date ?? todayKey())
  const [errors, setErrors] = useState<{ weight?: string; date?: string }>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const w = validateWeight(unit, weight)
    const d = validateDate(date)
    setErrors({ weight: w.error, date: d.error })
    if (w.error !== undefined || d.error !== undefined) return

    setSaving(true)
    setSaveError('')
    try {
      // Spreading `existing` keeps its id (so it updates, not adds) and any measurements.
      await db.bodyLogs.put({ ...existing, date: d.value, weightKg: w.value })
      onDone()
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        label="Weight"
        suffix={unit}
        inputMode="decimal"
        autoComplete="off"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        error={errors.weight}
      />
      <Field
        label="Date"
        type="date"
        max={todayKey()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
      />
      {saveError && <FieldError>{saveError}</FieldError>}
      <Button type="submit" disabled={saving} className="mt-1">
        {existing ? 'Save changes' : 'Save weight'}
      </Button>
    </form>
  )
}
