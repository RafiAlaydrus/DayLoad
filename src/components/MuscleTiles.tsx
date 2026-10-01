import { MUSCLE_GROUPS, muscleLabel } from '../lib/recommend'
import type { MuscleGroup } from '../types'
import { MuscleIcon } from './MuscleIcon'

interface Props<T extends MuscleGroup | 'all'> {
  name: string
  value: T
  onChange: (value: T) => void
}

const OPTIONS = ['all', ...MUSCLE_GROUPS] as const

/** Pick a muscle group (or all of them) from tiles with a body figure. Real radio inputs inside, so keyboard arrows and screen readers work. */
export function MuscleTiles({ name, value, onChange }: Props<MuscleGroup | 'all'>) {
  return (
    <fieldset>
      <legend className="sr-only">Muscle group</legend>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map((option) => (
          <label
            key={option}
            className="group press flex cursor-pointer flex-col items-center gap-1 rounded-chip border-[1.5px] border-border bg-surface px-1 pt-2.5 pb-2.5 has-checked:border-ink has-checked:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <MuscleIcon group={option} className="h-12 w-10 text-muted group-has-checked:text-ink" />
            <span className="text-[13px] leading-tight font-bold text-muted group-has-checked:text-ink">
              {option === 'all' ? 'All' : muscleLabel(option)}
            </span>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
