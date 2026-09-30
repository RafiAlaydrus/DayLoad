import { Check } from 'lucide-react'
import type { WeightUnit } from '../types'
import { FieldError } from './ui/Field'

interface Props {
  number: number
  unit: WeightUnit
  /** Bodyweight exercises have no weight box. */
  showWeight: boolean
  weight: string
  reps: string
  logged: boolean
  /** The next set to do. */
  current: boolean
  error?: string
  onChange: (patch: { weight?: string; reps?: string }) => void
  onToggle: () => void
}

const box =
  'min-h-11 w-full min-w-0 rounded-xl border border-border bg-bg py-2 pr-11 pl-3 text-[17px] font-bold text-ink disabled:border-transparent disabled:bg-transparent'

/** One set: number, weight, reps and a 44px check. Logged rows are locked; un-check to edit them. */
export function SetRow({ number, unit, showWeight, weight, reps, logged, current, error, onChange, onToggle }: Props) {
  const state = logged
    ? 'border-surface-2 bg-surface-2'
    : current
      ? 'border-border bg-surface'
      : 'border-border bg-transparent'
  return (
    <div>
      <div
        className={`grid items-center gap-2.5 rounded-2xl border px-3 py-2 ${state} ${
          showWeight ? 'grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_44px]' : 'grid-cols-[28px_minmax(0,1fr)_44px]'
        }`}
      >
        <span className="font-bold text-muted">{number}</span>
        {showWeight && (
          <label className="relative block">
            <span className="sr-only">{`Set ${number} weight in ${unit}`}</span>
            <input
              inputMode="decimal"
              autoComplete="off"
              className={box}
              value={weight}
              disabled={logged}
              onChange={(e) => onChange({ weight: e.target.value })}
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
              {unit}
            </span>
          </label>
        )}
        <label className="relative block">
          <span className="sr-only">{`Set ${number} reps`}</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            className={box}
            value={reps}
            disabled={logged}
            onChange={(e) => onChange({ reps: e.target.value })}
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
            reps
          </span>
        </label>
        <button
          type="button"
          aria-label={logged ? `Undo set ${number}` : `Log set ${number}`}
          aria-pressed={logged}
          onClick={onToggle}
          className={`press grid size-11 place-items-center rounded-full border-[1.5px] ${
            logged ? 'border-ink bg-ink text-bg' : 'border-border text-muted'
          }`}
        >
          <Check size={20} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
