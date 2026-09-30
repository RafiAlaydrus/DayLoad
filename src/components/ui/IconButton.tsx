import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

// 44px round touch target with a muted icon. `label` is the accessible name (icons alone say nothing).
const iconButtonClass = 'press grid size-11 shrink-0 place-items-center rounded-full text-muted'

export function IconButton({ label, className = '', ...props }: ComponentProps<'button'> & { label: string }) {
  return <button type="button" aria-label={label} className={`${iconButtonClass} ${className}`} {...props} />
}

export function IconLink({ label, className = '', ...props }: ComponentProps<typeof Link> & { label: string }) {
  return <Link aria-label={label} className={`${iconButtonClass} ${className}`} {...props} />
}
