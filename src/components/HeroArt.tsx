import type { ReactNode } from 'react'

export type HeroArtKind = 'barbell' | 'dumbbell' | 'kettlebell'

// The big faint drawing that bleeds off the corner of a hero card. Solid shapes in one colour
// (whatever text colour the parent sets), like the logo mark was, so it reads as a silhouette.
// Overlaps are fine because the caller fades the whole svg at once, not each shape.
const ART: Record<HeroArtKind, { viewBox: string; shapes: ReactNode }> = {
  barbell: {
    viewBox: '0 0 300 140',
    shapes: (
      <>
        <rect x="0" y="63" width="300" height="14" rx="7" />
        <rect x="46" y="8" width="28" height="124" rx="11" />
        <rect x="226" y="8" width="28" height="124" rx="11" />
        <rect x="80" y="28" width="20" height="84" rx="9" />
        <rect x="200" y="28" width="20" height="84" rx="9" />
        <rect x="104" y="52" width="10" height="36" rx="4" />
        <rect x="186" y="52" width="10" height="36" rx="4" />
      </>
    ),
  },
  dumbbell: {
    viewBox: '0 0 260 120',
    shapes: (
      <>
        <rect x="64" y="50" width="132" height="20" rx="10" />
        <rect x="26" y="14" width="44" height="92" rx="14" />
        <rect x="190" y="14" width="44" height="92" rx="14" />
        <rect x="4" y="34" width="22" height="52" rx="9" />
        <rect x="234" y="34" width="22" height="52" rx="9" />
      </>
    ),
  },
  kettlebell: {
    viewBox: '0 0 200 210',
    shapes: (
      <>
        <path d="M58 92C50 28 150 28 142 92" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
        <circle cx="100" cy="134" r="66" />
        <rect x="52" y="184" width="96" height="20" rx="10" />
      </>
    ),
  },
}

export function HeroArt({ kind, className }: { kind: HeroArtKind; className?: string }) {
  const { viewBox, shapes } = ART[kind]
  return (
    <svg viewBox={viewBox} fill="currentColor" aria-hidden="true" className={className}>
      {shapes}
    </svg>
  )
}
