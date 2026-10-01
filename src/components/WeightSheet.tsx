import { useState, type FormEvent } from 'react'
import { db } from '../db/db'
import { todayKey } from '../lib/dates'
import { MEASUREMENTS, type MeasurementId } from '../lib/goals'
import { measurementText, measurementUnit } from '../lib/units'
import { validateDate, validateMeasurement, validateWeight, weightInputFrom } from '../lib/validate'
import type { BodyLog, LengthUnit, WeightUnit } from '../types'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { SectionLabel } from './ui/Card'
import { Field, FieldError } from './ui/Field'

interface Props {
  /** "new" logs a fresh weight, an entry edits that entry, null keeps the sheet closed. */
  entry: BodyLog | 'new' | null
  unit: WeightUnit
  lengthUnit: LengthUnit
  onClose: () => void
}

export function WeightSheet({ entry, unit, lengthUnit, onClose }: Props) {
  return (
    <BottomSheet open={entry !== null} onClose={onClose} title={entry === 'new' ? 'Log weight' : 'Edit weight'}>
      {entry && (
        <WeightForm existing={entry === 'new' ? undefined : entry} unit={unit} lengthUnit={lengthUnit} onDone={onClose} />
      )}
    </BottomSheet>
  )
}

type Text = Record<MeasurementId, string>
const NO_TEXT: Text = { waist: '', chest: '', hips: '', arm: '', thigh: '' }

function WeightForm({
  existing,
  unit,
  lengthUnit,
  onDone,
}: {
  existing?: BodyLog
  unit: WeightUnit
  lengthUnit: LengthUnit
  onDone: () => void
}) {
  const [weight, setWeight] = useState(existing ? weightInputFrom(existing.weightKg, unit) : '')
  const [date, setDate] = useState(existing?.date ?? todayKey())
  const [measured, setMeasured] = useState<Text>(() => {
    const text = { ...NO_TEXT }
    for (const { id } of MEASUREMENTS) {
      const cm = existing?.measurements?.[id]
      if (typeof cm === 'number') text[id] = measurementText(cm, lengthUnit)
    }
    return text
  })
  const [errors, setErrors] = useState<{ weight?: string; date?: string } & Partial<Text>>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const w = validateWeight(unit, weight)
    const d = validateDate(date)
    const checked = MEASUREMENTS.map(({ id }) => [id, validateMeasurement(lengthUnit, measured[id])] as const)
    setErrors({ weight: w.error, date: d.error, ...Object.fromEntries(checked.map(([id, r]) => [id, r.error])) })
    if (w.error !== undefined || d.error !== undefined || checked.some(([, r]) => r.error !== undefined)) return

    setSaving(true)
    setSaveError('')
    try {
      // Spreading `existing` keeps its id (so it updates, not adds), and measurements this form does not list.
      const log: BodyLog = { ...existing, date: d.value, weightKg: w.value }
      const measurements = { ...existing?.measurements }
      for (const [id, r] of checked) {
        if (r.value === null) delete measurements[id]
        else if (r.value !== undefined) measurements[id] = r.value
      }
      if (Object.keys(measurements).length > 0) log.measurements = measurements
      else delete log.measurements
      await db.bodyLogs.put(log)
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

      <div>
        <SectionLabel>Measurements, optional</SectionLabel>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">Saved with this weigh-in. Leave blank what you did not measure.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MEASUREMENTS.map(({ id, label }) => (
            <Field
              key={id}
              label={label}
              suffix={measurementUnit(lengthUnit)}
              inputMode="decimal"
              autoComplete="off"
              value={measured[id]}
              onChange={(e) => setMeasured({ ...measured, [id]: e.target.value })}
              error={errors[id]}
            />
          ))}
        </div>
      </div>

      {saveError && <FieldError>{saveError}</FieldError>}
      <Button type="submit" disabled={saving} className="mt-1">
        {existing ? 'Save changes' : 'Save weight'}
      </Button>
    </form>
  )
}
