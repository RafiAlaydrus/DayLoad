import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

// surface, 1px border, radius 22, padding 18 (DESIGN.md). `compact` is the 14px padding the small stat cards use.
const cardClass = 'rounded-card border border-border bg-surface'

export function Card({ compact, className = '', ...props }: ComponentProps<'div'> & { compact?: boolean }) {
  return <div className={`${cardClass} ${compact ? 'p-[14px]' : 'p-[18px]'} ${className}`} {...props} />
}

/** A card that is a link: gets the press feedback. */
export function CardLink({ className = '', ...props }: ComponentProps<typeof Link>) {
  return <Link className={`press block ${cardClass} p-[18px] ${className}`} {...props} />
}

/** Small uppercase label that tells a data label from its value at a glance (see DESIGN.md). */
export function SectionLabel({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`text-xs font-semibold uppercase tracking-[0.08em] text-muted ${className}`} {...props} />
}
