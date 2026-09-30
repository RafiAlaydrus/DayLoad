interface Props<T extends string> {
  legend: string
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  /** Selected option is filled with ink (the time picker) instead of outlined. */
  filled?: boolean
  /** Options keep their natural width and wrap onto more lines (muscle group chips). */
  wrap?: boolean
  /** Hide the legend visually but keep it for screen readers, when the screen already has a heading. */
  hideLegend?: boolean
}

/** Pick one option. Real radio inputs underneath, so keyboard arrows and screen readers work with no extra code. */
export function Segmented<T extends string>({ legend, name, value, options, onChange, filled, wrap, hideLegend }: Props<T>) {
  const selected = filled
    ? 'has-checked:border-ink has-checked:bg-ink has-checked:text-bg'
    : 'has-checked:border-ink has-checked:bg-surface-2 has-checked:text-ink'
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'mb-2 text-[13px] font-semibold text-muted'}>{legend}</legend>
      <div className={wrap ? 'flex flex-wrap gap-2' : 'flex gap-2'}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`press flex min-h-12 cursor-pointer items-center justify-center rounded-chip border border-border bg-bg text-[15px] font-bold text-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
              wrap ? 'px-4' : 'flex-1'
            } ${selected}`}
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
