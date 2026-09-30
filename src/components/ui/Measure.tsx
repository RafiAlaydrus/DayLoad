import { Fragment } from 'react'
import type { Parts } from '../../lib/units'

/** A big Barlow Condensed number with a small muted unit ("72.4 kg", "5 ft 9 in"). Size comes from the parent's text size. */
export function Measure({ parts, className = '' }: { parts: Parts; className?: string }) {
  return (
    <span className={`font-display font-bold ${className}`}>
      {parts.map(([value, unit], i) => (
        <Fragment key={unit}>
          {i > 0 && ' '}
          {value}
          <span className="ml-1 text-[0.48em] text-muted">{unit}</span>
        </Fragment>
      ))}
    </span>
  )
}
