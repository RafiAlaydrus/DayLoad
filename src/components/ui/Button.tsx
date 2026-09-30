import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary'
type Size = 'md' | 'sm' | 'lg'

// Never under 44px tall. Primary is ink on bg, per DESIGN.md.
const base =
  'press inline-flex items-center justify-center gap-2 rounded-full font-bold disabled:opacity-50 disabled:active:transform-none'
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg',
  secondary: 'border border-border bg-surface text-ink',
}
const sizes: Record<Size, string> = {
  md: 'min-h-12 px-6 text-[15px]',
  sm: 'min-h-11 px-4 text-sm',
  // The big pinned action at the bottom of Hit the gym and Workout.
  lg: 'min-h-[60px] w-full px-8 text-[17px]',
}

const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className = '') =>
  `${base} ${variants[variant]} ${sizes[size]} ${className}`

type Props = { variant?: Variant; size?: Size }

export function Button({ variant, size, className, ...props }: ComponentProps<'button'> & Props) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & Props) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}
