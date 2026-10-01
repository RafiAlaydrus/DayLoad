import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Target } from '../lib/progress'
import { rampUpSets, rampUpText, WARMUP } from '../lib/warmup'
import type { Exercise, WeightUnit } from '../types'
import { Card, SectionLabel } from './ui/Card'

interface Props {
  /** The first exercise of the workout. */
  exercise: Exercise
  /** Its overload target, if there is history. Ramp-up weights are worked out from it. */
  target: Target | null
  unit: WeightUnit
  /** Open at first when nothing is logged yet, so the suggestion is seen before the first set. */
  startOpen: boolean
}

/** Shown on the first exercise: a few lines for the muscle group, and ramp-up sets. A suggestion only, nothing is saved. */
export function WarmUp({ exercise, target, unit, startOpen }: Props) {
  const [open, setOpen] = useState(startOpen)
  const weighted = exercise.equipmentIds.length > 0
  const ramp = weighted && target ? rampUpSets(target.weightKg, unit) : []

  let rampLine: string
  if (!weighted) rampLine = `Before ${exercise.name}: one easy set, well short of what you usually do.`
  else if (ramp.length > 0) rampLine = `Before ${exercise.name}: ${rampUpText(ramp, unit)}.`
  else if (target && target.weightKg > 0) rampLine = `${exercise.name} is light enough to start straight in.`
  else rampLine = `No history for ${exercise.name} yet, so start with two easy sets of 8.`

  return (
    <Card compact>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="press -my-1 flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <SectionLabel>Warm-up</SectionLabel>
        {open ? (
          <ChevronUp size={20} strokeWidth={2} aria-hidden="true" className="text-muted" />
        ) : (
          <ChevronDown size={20} strokeWidth={2} aria-hidden="true" className="text-muted" />
        )}
      </button>
      {open && (
        <div className="mt-1.5 flex flex-col gap-2.5">
          <ul className="flex flex-col gap-2">
            {WARMUP[exercise.muscleGroup].map((line) => (
              <li key={line} className="flex gap-3 text-[14px] leading-snug">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-border pt-2.5 text-[14px] leading-snug font-semibold">{rampLine}</p>
        </div>
      )}
    </Card>
  )
}
