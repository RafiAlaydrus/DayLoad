import { Settings as SettingsIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { PROFILE_ID } from '../db/seed'
import { todayKey } from '../lib/dates'
import { validateAge, validateHeight, validateWeight, type StatsInput } from '../lib/validate'
import type { Settings } from '../types'
import { StatsFields } from './StatsFields'
import { Button } from './ui/Button'
import { Card, SectionLabel } from './ui/Card'
import { Field, FieldError } from './ui/Field'
import { IconLink } from './ui/IconButton'

/** Shown on the Profile tab until a profile exists: age and height, then a first weight. */
export function Onboarding({ settings }: { settings: Settings }) {
  const { weightUnit, lengthUnit } = settings
  const [step, setStep] = useState<1 | 2>(1)
  const [stats, setStats] = useState<StatsInput>({ age: '', heightA: '', heightB: '' })
  const [weight, setWeight] = useState('')
  const [errors, setErrors] = useState<{ age?: string; height?: string; weight?: string }>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  function next(event: FormEvent) {
    event.preventDefault()
    const age = validateAge(stats.age)
    const height = validateHeight(lengthUnit, stats.heightA, stats.heightB)
    setErrors({ age: age.error, height: height.error })
    if (age.error === undefined && height.error === undefined) setStep(2)
  }

  async function finish(event: FormEvent) {
    event.preventDefault()
    const age = validateAge(stats.age)
    const height = validateHeight(lengthUnit, stats.heightA, stats.heightB)
    const w = validateWeight(weightUnit, weight)
    setErrors({ weight: w.error })
    if (age.error !== undefined || height.error !== undefined || w.error !== undefined) return

    setSaving(true)
    setSaveError('')
    try {
      // Profile and first weight together, so a failure can't leave half of it saved.
      await db.transaction('rw', db.profile, db.bodyLogs, async () => {
        await db.profile.put({ id: PROFILE_ID, age: age.value, heightCm: height.value })
        await db.bodyLogs.add({ date: todayKey(), weightKg: w.value })
      })
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[34px] font-bold leading-none">Your profile</h1>
        <IconLink to="/profile/settings" label="Settings">
          <SettingsIcon size={22} strokeWidth={2} aria-hidden="true" />
        </IconLink>
      </div>
      <p className="-mt-2 text-[15px] leading-relaxed text-muted">Two quick steps. Everything stays on this phone.</p>

      <Card>
        <SectionLabel>{step === 1 ? 'Step 1 of 2: About you' : 'Step 2 of 2: Your weight'}</SectionLabel>
        {step === 1 ? (
          <form onSubmit={next} noValidate className="mt-4 flex flex-col gap-5">
            <StatsFields unit={lengthUnit} value={stats} onChange={setStats} errors={errors} />
            <Button type="submit">Next: first weight</Button>
          </form>
        ) : (
          <form onSubmit={finish} noValidate className="mt-4 flex flex-col gap-4">
            <Field
              label="Weight today"
              suffix={weightUnit}
              inputMode="decimal"
              autoComplete="off"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              error={errors.weight}
            />
            {saveError && <FieldError>{saveError}</FieldError>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} disabled={saving}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                Save profile
              </Button>
            </div>
          </form>
        )}
      </Card>

      <p className="text-[13px] leading-relaxed text-muted">
        Want lb or ft/in, or moving from another phone?{' '}
        <Link to="/profile/settings" className="inline-flex min-h-11 items-center font-bold text-ink underline">
          Open settings
        </Link>
      </p>
    </>
  )
}
