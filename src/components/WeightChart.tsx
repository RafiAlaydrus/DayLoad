import { formatDate, parseDateKey, todayKey } from '../lib/dates'
import { partsToText, weightParts } from '../lib/units'
import type { BodyLog, WeightUnit } from '../types'

const W = 300
const H = 100
const PAD_Y = 10

/**
 * Weight over time. `logs` must be sorted oldest first. Points sit at their real dates, so
 * a two-week gap looks like a two-week gap. The line stretches to the card width (the SVG has
 * no fixed aspect), so the latest point is an HTML dot, which a stretched SVG circle can't be.
 */
export function WeightChart({ logs, unit }: { logs: BodyLog[]; unit: WeightUnit }) {
  const n = logs.length
  const first = logs[0]
  const last = logs[n - 1]
  const kgs = logs.map((l) => l.weightKg)
  const min = Math.min(...kgs)
  const max = Math.max(...kgs)
  const t0 = parseDateKey(first.date).getTime()
  const t1 = parseDateKey(last.date).getTime()

  const x = (i: number) => {
    if (n === 1) return W / 2
    // All on one day: space them evenly instead of stacking them.
    if (t1 === t0) return (i / (n - 1)) * W
    return ((parseDateKey(logs[i].date).getTime() - t0) / (t1 - t0)) * W
  }
  const y = (kg: number) => (max === min ? H / 2 : PAD_Y + (1 - (kg - min) / (max - min)) * (H - 2 * PAD_Y))

  const points = logs.map((l, i) => `${x(i).toFixed(1)},${y(l.weightKg).toFixed(1)}`).join(' ')
  const description =
    n === 1
      ? `Weight ${partsToText(weightParts(last.weightKg, unit))}, one entry`
      : `Weight trend from ${partsToText(weightParts(first.weightKg, unit))} to ${partsToText(weightParts(last.weightKg, unit))}, ${n} entries`

  return (
    <div className="mt-3">
      <div role="img" aria-label={description} className="relative h-[110px]">
        {n > 1 && (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-4 ring-surface"
          style={{ left: `${(x(n - 1) / W) * 100}%`, top: `${(y(last.weightKg) / H) * 100}%` }}
        />
      </div>
      {n > 1 ? (
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{formatDate(first.date)}</span>
          <span>{last.date === todayKey() ? 'Today' : formatDate(last.date)}</span>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-muted">Log one more weight to see your trend.</p>
      )}
    </div>
  )
}
