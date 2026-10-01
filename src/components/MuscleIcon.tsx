import type { ReactNode } from 'react'
import type { MuscleGroup } from '../types'

// A small body figure per muscle group, so the filter shows where the muscle is instead of a bare
// word. Same one-colour rule as the equipment drawings (whatever text colour the parent sets), but
// flat shapes instead of outlines: at this size a worked muscle only reads as a solid area. The
// worked muscle is full strength and the rest of the body is faint. 40 x 48 canvas, the figure
// faces front (the "back" one is the same figure seen from behind). Every shape is drawn once for
// the left half and mirrored. The body runs 0.3 past the middle so the halves meet without a seam;
// the worked muscles stop 0.6 short of it, which leaves the line between the pecs, the abs, the
// legs and (on the back) the spine.

const LEFT = {
  // The body without the head: shoulder, arm hanging a little away from the side, hip and leg.
  body: (
    <path d="M20.3 10H17.6C14.4 10.4 11 11 9 13.8C7.8 15.4 7.3 17.8 7 20.6L5.8 27.6C5.4 29.4 4.9 30.8 4.9 32Q4.9 33.6 6.4 33.6Q7.9 33.6 8 32L9.1 27L10.6 21.2L11.9 21.6L12.7 27.4L12.5 29.4C12.5 36 12.9 41.5 13.3 46Q13.4 47.6 15 47.6H18.7Q19.5 47.6 19.5 46.6L19.4 30.4Q19.6 29.4 20.3 29.4Z" />
  ),
  chest: <path d="M19.4 12.6H16.9C14.9 12.6 13.7 13.6 13.7 15.4V17.2C13.7 19 15 20 16.9 20H19.4Z" />,
  delts: <path d="M8.9 14.1C10.2 12.2 12.2 11.2 14.2 11C13.4 12.6 12.9 14.8 12.9 17.3V18.8L10.4 20.1L7.3 19.8C7.4 17.8 7.9 15.8 8.9 14.1Z" />,
  arms: <path d="M10.5 21.9L7.2 21.2L5.9 27.6C5.5 29.4 5.1 30.8 5.1 32Q5.1 33.2 6.4 33.2Q7.7 33.2 7.8 32L8.9 27Z" />,
  // Three rows of abs.
  core: (
    <>
      <rect x="14.2" y="21.4" width="5.2" height="2.2" rx="1.1" />
      <rect x="14.2" y="24.4" width="5.2" height="2.2" rx="1.1" />
      <rect x="14.2" y="27.4" width="5.2" height="1.8" rx="0.9" />
    </>
  ),
  legs: <path d="M13.2 30.6H19.2V46.1Q19.2 46.9 18.4 46.9H15.1Q13.9 46.9 13.8 45.8C13.4 41.5 13.2 36 13.2 30.6Z" />,
  // Upper back and lats in one shape that narrows to the waist.
  back: <path d="M19.4 11.8H16.6C14 12 12.5 13 12.1 15L12.5 21C12.9 24 13.7 26.6 14.9 28.8H19.4Z" />,
} satisfies Record<string, ReactNode>

type Part = Exclude<keyof typeof LEFT, 'body'>

const FIGURE: Record<MuscleGroup | 'all', Part[]> = {
  all: ['delts', 'chest', 'arms', 'core', 'legs'],
  chest: ['chest'],
  back: ['back'],
  shoulders: ['delts'],
  arms: ['arms'],
  legs: ['legs'],
  core: ['core'],
}

const FAINT = 0.3

/** The figure for a muscle group, or the whole body for "all" (every part full strength). */
export function MuscleIcon({ group, className }: { group: MuscleGroup | 'all'; className?: string }) {
  const worked = FIGURE[group]
  // The same shapes twice, the second one mirrored across the middle.
  const twice = (shapes: ReactNode) => (
    <>
      <g>{shapes}</g>
      <g transform="translate(40 0) scale(-1 1)">{shapes}</g>
    </>
  )
  return (
    <svg viewBox="0 0 40 48" fill="currentColor" aria-hidden="true" className={className}>
      <g opacity={group === 'all' ? 1 : FAINT}>
        <circle cx="20" cy="5" r="3.4" />
        {twice(LEFT.body)}
      </g>
      {group !== 'all' && twice(worked.map((part) => <g key={part}>{LEFT[part]}</g>))}
    </svg>
  )
}
