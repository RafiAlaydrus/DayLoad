import { useState, type FormEvent } from 'react'
import { db } from '../db/db'
import { PROFILE_ID } from '../db/seed'
import { statsInputFrom, validateAge, validateHeight, type StatsInput } from '../lib/validate'
import type { LengthUnit, Profile } from '../types'
import { StatsFields } from './StatsFields'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { FieldError } from './ui/Field'

interface Props {
  open: boolean
  profile: Profile
  unit: LengthUnit
  onClose: () => void
}

export function StatsSheet({ open, profile, unit, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Edit stats">
      <StatsForm profile={profile} unit={unit} onDone={onClose} />
    </BottomSheet>
  )
}

function StatsForm({ profile, unit, onDone }: { profile: Profile; unit: LengthUnit; onDone: () => void }) {
  const [input, setInput] = useState<StatsInput>(() => statsInputFrom(profile, unit))
  const [errors, setErrors] = useState<{ age?: string; height?: string }>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const age = validateAge(input.age)
    const height = validateHeight(unit, input.heightA, input.heightB)
    setErrors({ age: age.error, height: height.error })
    if (age.error !== undefined || height.error !== undefined) return

    setSaving(true)
    setSaveError('')
    try {
      await db.profile.put({ id: PROFILE_ID, age: age.value, heightCm: height.value })
      onDone()
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <StatsFields unit={unit} value={input} onChange={setInput} errors={errors} />
      {saveError && <FieldError>{saveError}</FieldError>}
      <Button type="submit" disabled={saving}>
        Save stats
      </Button>
    </form>
  )
}
