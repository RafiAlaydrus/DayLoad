interface Props<T extends string> {
  legend: string
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

/** Pick one option. Real radio inputs underneath, so keyboard arrows and screen readers work with no extra code. */
export function Segmented<T extends string>({ legend, name, value, options, onChange }: Props<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-muted">{legend}</legend>
      <div className="flex gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="press flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-chip border border-border bg-bg text-[15px] font-bold text-muted has-checked:border-ink has-checked:bg-surface-2 has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
