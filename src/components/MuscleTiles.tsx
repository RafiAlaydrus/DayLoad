import { Moon } from 'lucide-react'
import { MUSCLE_GROUPS, muscleLabel } from '../lib/recommend'
import type { MuscleGroup } from '../types'
import { MuscleIcon } from './MuscleIcon'

export type Choice = MuscleGroup | 'all' | 'rest'

interface Props {
  name: string
  /** Nothing is selected when this is '' (a timetable day that was never set). A list means several can be on at once (checkboxes). */
  value: Choice | '' | readonly Choice[]
  /** The tile before the six muscle groups: "All" for the Library filter, "Rest" for a timetable day. */
  first?: 'all' | 'rest'
  onChange: (value: Choice) => void
}

/** Pick a muscle group, and "All" or "Rest", from tiles with a body figure. Real radio inputs inside, so keyboard arrows and screen readers work. */
export function MuscleTiles({ name, value, first = 'all', onChange }: Props) {
  const options: Choice[] = [first, ...MUSCLE_GROUPS]
  const multiple = typeof value !== 'string'
  return (
    <fieldset>
      <legend className="sr-only">{multiple ? 'Muscle groups' : 'Muscle group'}</legend>
      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="group press flex cursor-pointer flex-col items-center gap-1 rounded-chip border-[1.5px] border-border bg-surface px-1 pt-2.5 pb-2.5 has-checked:border-ink has-checked:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            {option === 'rest' ? (
              // A moon for a day off: the one tile that is not a muscle, so it has no body figure.
              <span className="grid h-12 w-10 place-items-center text-muted group-has-checked:text-ink">
                <Moon size={26} strokeWidth={2} aria-hidden="true" />
              </span>
            ) : (
              <MuscleIcon group={option} className="h-12 w-10 text-muted group-has-checked:text-ink" />
            )}
            <span className="text-[13px] leading-tight font-bold text-muted group-has-checked:text-ink">
              {option === 'all' ? 'All' : option === 'rest' ? 'Rest' : muscleLabel(option)}
            </span>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={option}
              checked={multiple ? value.includes(option) : value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
