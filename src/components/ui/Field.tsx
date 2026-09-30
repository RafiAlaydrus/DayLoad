import { CircleAlert } from 'lucide-react'
import { useId, type ComponentProps } from 'react'

/** Error text with an icon. No red exists in the palette, so the words and icon carry the meaning. */
export function FieldError({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-ink">
      <CircleAlert size={16} className="mt-px shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

type FieldProps = Omit<ComponentProps<'input'>, 'id'> & { label: string; suffix?: string; error?: string }

/** A labelled input. Text is 16px so iOS never zooms in on focus. */
export function Field({ label, suffix, error, className = '', ...input }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-12 w-full appearance-none rounded-chip border bg-bg px-4 text-base font-semibold text-ink placeholder:text-muted [&::-webkit-date-and-time-value]:text-left ${
            error ? 'border-ink' : 'border-border'
          } ${suffix ? 'pr-12' : ''}`}
          {...input}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted">
            {suffix}
          </span>
        )}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
