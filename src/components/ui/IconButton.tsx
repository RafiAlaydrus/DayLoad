import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

// 44px round touch target. `label` is the accessible name (icons alone say nothing).
// `outlined` is the bordered circle the Hit the gym and Workout mockups use for back, end and swap.
const iconButtonClass = (outlined?: boolean, className = '') =>
  `press grid size-11 shrink-0 place-items-center rounded-full ${
    outlined ? 'border border-border bg-surface text-ink' : 'text-muted'
  } ${className}`

type Props = { label: string; outlined?: boolean }

export function IconButton({ label, outlined, className, ...props }: ComponentProps<'button'> & Props) {
  return <button type="button" aria-label={label} className={iconButtonClass(outlined, className)} {...props} />
}

export function IconLink({ label, outlined, className, ...props }: ComponentProps<typeof Link> & Props) {
  return <Link aria-label={label} className={iconButtonClass(outlined, className)} {...props} />
}
