import type { Exercise } from '../types'
import { SectionLabel } from './ui/Card'

/** Target muscles, form cues and common mistakes. Used on the exercise page and inside the workout's how-to sheet. */
export function HowTo({ exercise }: { exercise: Exercise }) {
  const { targetMuscles, cues, mistakes } = exercise.howTo
  return (
    <div className="flex flex-col gap-5">
      <section>
        <SectionLabel>Works</SectionLabel>
        <p className="mt-1.5 text-[15px] font-semibold">{targetMuscles.join(', ')}</p>
      </section>
      <section>
        <SectionLabel>Form cues</SectionLabel>
        <ol className="mt-2 flex flex-col gap-2.5">
          {cues.map((cue, i) => (
            <li key={cue} className="flex gap-3 text-[15px] leading-snug">
              <span className="font-display text-xl font-bold leading-none text-muted">{i + 1}</span>
              <span>{cue}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <SectionLabel>Common mistakes</SectionLabel>
        <ul className="mt-2 flex flex-col gap-2.5">
          {mistakes.map((mistake) => (
            <li key={mistake} className="flex gap-3 text-[15px] leading-snug text-muted">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" />
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
