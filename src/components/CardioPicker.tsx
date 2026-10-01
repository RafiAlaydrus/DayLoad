import { allowsSteps, CARDIO_KINDS, GOAL_PRESETS, type CardioDraft } from '../lib/cardio'
import type { CardioGoal } from '../types'
import { Field } from './ui/Field'
import { Segmented } from './ui/Segmented'

interface Props {
  value: CardioDraft
  onChange: (value: CardioDraft) => void
  /** The goal can be left blank (starting a session with no target). In a timetable a goal is required. */
  goalOptional?: boolean
  error?: string
  /** Makes the radio names unique when two pickers could exist on a screen. */
  name: string
}

/** Cardio type, then a goal in minutes or (for walking, running and the treadmill) steps. Presets fill the number, which can also be typed. */
export function CardioPicker({ value, onChange, goalOptional, error, name }: Props) {
  const steps = allowsSteps(value.kind)
  const presets = GOAL_PRESETS[value.type]
  const set = (patch: Partial<CardioDraft>) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        legend="Type"
        name={`${name}-kind`}
        wrap
        value={value.kind}
        options={CARDIO_KINDS.map((k) => ({ value: k.id, label: k.label }))}
        // A step goal makes no sense for cycling, so leaving the walking kinds puts the goal back to minutes.
        onChange={(kind) => (allowsSteps(kind) ? set({ kind }) : onChange({ kind, type: 'minutes', text: value.type === 'minutes' ? value.text : '30' }))}
      />
      {steps && (
        <Segmented<CardioGoal['type']>
          legend="Goal"
          name={`${name}-goal`}
          value={value.type}
          options={[
            { value: 'minutes', label: 'Time' },
            { value: 'steps', label: 'Steps' },
          ]}
          onChange={(type) => set({ type, text: String(GOAL_PRESETS[type][1]) })}
        />
      )}
      <div>
        <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Quick picks">
          {presets.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={value.text === String(n)}
              onClick={() => set({ text: String(n) })}
              className="press min-h-11 rounded-chip border border-border bg-bg px-3.5 text-sm font-bold text-muted aria-pressed:border-ink aria-pressed:bg-surface-2 aria-pressed:text-ink"
            >
              {value.type === 'minutes' ? `${n} min` : n.toLocaleString('en-US')}
            </button>
          ))}
        </div>
        <Field
          label={goalOptional ? `Goal in ${value.type === 'minutes' ? 'minutes' : 'steps'} (optional)` : value.type === 'minutes' ? 'Minutes' : 'Steps'}
          suffix={value.type === 'minutes' ? 'min' : 'steps'}
          inputMode="numeric"
          autoComplete="off"
          value={value.text}
          onChange={(e) => set({ text: e.target.value })}
          error={error}
        />
      </div>
    </div>
  )
}
