import type { MuscleGroup, WeightUnit } from '../types'
import { STEP } from './progress.ts'
import { fromKg, loadText, toKg } from './units.ts'

// The warm-up suggestion shown before the first exercise: a few lines for the muscle group, and
// lighter ramp-up sets worked out from the target weight. A suggestion only, nothing is logged.
// Pure, so it is tested in Node.

export const WARMUP: Record<MuscleGroup, readonly string[]> = {
  chest: [
    '5 minutes of easy cardio: the rower, a bike or a brisk walk.',
    'Arm circles and shoulder rolls, 10 each way.',
    'Band pull-aparts or slow scapular push-ups, 10 reps.',
  ],
  back: [
    '5 minutes of easy cardio on the rower or a bike.',
    'Cat-cow and a gentle upper-back twist, 8 each side.',
    'Band pull-aparts, or hang from a bar for 20 seconds.',
  ],
  shoulders: [
    '5 minutes of easy cardio.',
    'Arm circles from small to large, 10 each way.',
    'Band external rotations or pull-aparts, 10 reps.',
  ],
  arms: [
    '5 minutes of easy cardio.',
    'Wrist circles and loose arm swings, 10 each.',
    'One light set of curls or pushdowns with a very easy weight, 15 reps.',
  ],
  legs: [
    '5 minutes of easy cardio: a bike or a brisk walk.',
    'Bodyweight squats, 10 reps, and leg swings, 10 each leg.',
    'Glute bridges, 10 reps.',
  ],
  core: [
    '5 minutes of easy cardio.',
    'Cat-cow, 8 reps, and a few slow torso rotations.',
    'Dead bugs or a short plank, about 20 seconds.',
  ],
}

export interface RampSet {
  weightKg: number
  reps: number
}

/** About half the working weight for 8, then about three quarters for 4. */
const RAMP = [
  { fraction: 0.5, reps: 8 },
  { fraction: 0.75, reps: 4 },
] as const

/**
 * Lighter sets before the working weight, rounded to the step the user lifts in (2.5 kg or 5 lb).
 * A set that rounds to nothing, to the working weight or to the same as the one before is dropped,
 * so a very light lift gets fewer ramp sets or none.
 */
export function rampUpSets(workingKg: number, unit: WeightUnit): RampSet[] {
  if (workingKg <= 0) return []
  const sets: RampSet[] = []
  for (const { fraction, reps } of RAMP) {
    const weightKg = toKg(Math.round((fromKg(workingKg, unit) * fraction) / STEP[unit]) * STEP[unit], unit)
    if (weightKg > 0 && weightKg < workingKg && !sets.some((s) => s.weightKg === weightKg)) sets.push({ weightKg, reps })
  }
  return sets
}

/** "30 kg × 8, then 45 kg × 4". */
export const rampUpText = (sets: readonly RampSet[], unit: WeightUnit) =>
  sets.map((s) => `${loadText(s.weightKg, unit)} ${unit} × ${s.reps}`).join(', then ')
