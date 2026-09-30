import { Check } from 'lucide-react'

interface Props {
  type: 'radio' | 'checkbox'
  name?: string
  checked: boolean
  onChange: () => void
  title: string
  subtitle?: string
  /** Smaller chip for long checklists (equipment). */
  compact?: boolean
}

/** A selectable card with a check circle (gym, equipment). Real radio or checkbox inside, so keyboard and screen readers work. */
export function Option({ type, name, checked, onChange, title, subtitle, compact }: Props) {
  return (
    <label
      className={`group press flex cursor-pointer items-center justify-between gap-3 border-[1.5px] border-border bg-surface has-checked:border-ink has-checked:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
        compact ? 'min-h-12 rounded-chip px-3.5 py-2' : 'min-h-[68px] rounded-[20px] px-[18px] py-4'
      }`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={compact ? 'text-sm font-bold leading-tight' : 'text-base font-bold'}>{title}</span>
        {subtitle && <span className="text-[13px] text-muted">{subtitle}</span>}
      </span>
      <span
        aria-hidden="true"
        className="grid size-[26px] shrink-0 place-items-center rounded-full border-[1.5px] border-border group-has-checked:border-ink group-has-checked:bg-ink"
      >
        <Check size={16} strokeWidth={2.6} className="text-bg opacity-0 group-has-checked:opacity-100" />
      </span>
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
    </label>
  )
}
