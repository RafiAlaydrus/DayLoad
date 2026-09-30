import type { LengthUnit } from '../types'
import type { StatsInput } from '../lib/validate'
import { Field, FieldError } from './ui/Field'

interface Props {
  unit: LengthUnit
  value: StatsInput
  onChange: (value: StatsInput) => void
  errors: { age?: string; height?: string }
}

/** Age and height, typed in the user's units. Shared by onboarding and "Edit stats". */
export function StatsFields({ unit, value, onChange, errors }: Props) {
  const set = (patch: Partial<StatsInput>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Age in years"
        inputMode="numeric"
        autoComplete="off"
        value={value.age}
        onChange={(e) => set({ age: e.target.value })}
        error={errors.age}
      />
      {unit === 'cm' ? (
        <Field
          label="Height"
          suffix="cm"
          inputMode="decimal"
          autoComplete="off"
          value={value.heightA}
          onChange={(e) => set({ heightA: e.target.value })}
          error={errors.height}
        />
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Height, feet"
              suffix="ft"
              inputMode="numeric"
              autoComplete="off"
              value={value.heightA}
              onChange={(e) => set({ heightA: e.target.value })}
            />
            <Field
              label="Height, inches"
              suffix="in"
              inputMode="decimal"
              autoComplete="off"
              value={value.heightB}
              onChange={(e) => set({ heightB: e.target.value })}
            />
          </div>
          {errors.height && <FieldError>{errors.height}</FieldError>}
        </div>
      )}
    </div>
  )
}
