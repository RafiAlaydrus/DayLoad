import { ChevronDown } from 'lucide-react'
import { useId, type ComponentProps } from 'react'

/** A labelled native select (iOS shows its wheel picker). 16px text so iOS never zooms in. Pass <option> and <optgroup> as children. */
export function Select({ label, className = '', children, ...props }: ComponentProps<'select'> & { label: string }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="min-h-12 w-full appearance-none rounded-chip border border-border bg-surface pr-11 pl-4 text-base font-semibold text-ink"
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={20} strokeWidth={2} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  )
}
