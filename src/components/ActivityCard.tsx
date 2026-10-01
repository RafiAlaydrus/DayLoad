import { useFinishedCardio, useFinishedSessions } from '../hooks/useData'
import { todayKey } from '../lib/dates'
import { activityByDay, HEAT_STEPS, HEAT_WEEKS, heatWeeks, monthStarts, type HeatLevel } from '../lib/heatmap'
import { STREAK_MIN, weeklyStreak } from '../lib/streak'
import { Card, SectionLabel } from './ui/Card'
import { Loading } from './ui/Loading'
import { Measure } from './ui/Measure'

// Empty days sit just under the card colour, then the three steps climb through the palette, so it reads in both themes.
const SHADE: Record<HeatLevel, string> = { 0: 'bg-surface-2', 1: 'bg-accent', 2: 'bg-muted', 3: 'bg-ink' }
const LEVEL_NAMES = ['no activity', 'under 40 minutes', '40 to 59 minutes', '60 minutes or more']
const COLUMNS = { gridTemplateColumns: `repeat(${HEAT_WEEKS}, minmax(0, 1fr))` }

/**
 * Home's activity card: the weekly streak as the headline, and below it a square for each of the last
 * 18 weeks of days, darker the more minutes you were active (lifting plus cardio).
 */
export function ActivityCard() {
  const sessions = useFinishedSessions()
  const cardio = useFinishedCardio()
  if (!sessions || !cardio) return <Loading className="h-[250px]" />

  const today = todayKey()
  const { weeks, thisWeek } = weeklyStreak([...sessions, ...cardio], today)
  const columns = heatWeeks(activityByDay(sessions, cardio), today)
  const activeDays = columns.flat().filter((c) => c.level > 0).length
  const months = new Map(monthStarts(columns).map((s) => [s.col, s.month]))
  const monthName = (month: number) => new Date(2026, month, 1).toLocaleDateString(undefined, { month: 'short' })

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>Streak</SectionLabel>
        <span className="text-[13px] text-muted">
          {thisWeek >= STREAK_MIN ? 'This week is done' : `${thisWeek} of ${STREAK_MIN} workouts this week`}
        </span>
      </div>
      {weeks === 0 ? (
        <p className="mt-1.5 text-[15px] font-semibold">No streak yet</p>
      ) : (
        <Measure parts={[[String(weeks), weeks === 1 ? 'week' : 'weeks']]} className="mt-1.5 block text-[38px] leading-none" />
      )}

      {/* One picture for the whole grid: it would be 126 squares to read out otherwise. */}
      <div role="img" aria-label={`Activity over the last ${HEAT_WEEKS} weeks: ${activeDays} active ${activeDays === 1 ? 'day' : 'days'}.`} className="mt-4">
        <div className="mb-1 grid h-3.5 gap-[3px]" style={COLUMNS} aria-hidden="true">
          {columns.map((_, col) => (
            <span key={col} className="relative">
              {months.has(col) && (
                <span className="absolute left-0 text-[11px] leading-none font-semibold whitespace-nowrap text-muted">{monthName(months.get(col)!)}</span>
              )}
            </span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={COLUMNS} aria-hidden="true">
          {columns.map((column, col) =>
            column.map((cell) =>
              cell.future ? (
                <span key={cell.date} />
              ) : (
                <span
                  key={cell.date}
                  // The wave of squares appearing runs left to right, a few milliseconds per week.
                  style={{ animationDelay: `${col * 14}ms` }}
                  className={`heat-in aspect-square rounded-[3px] ${SHADE[cell.level]} ${cell.today ? 'outline-[1.5px] outline-offset-1 outline-ink' : ''}`}
                />
              ),
            ),
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-muted">
        <span>{activeDays === 0 ? 'Your first workout lights the first square.' : 'Minutes active per day'}</span>
        <span className="flex shrink-0 items-center gap-1" aria-label={`Lighter to darker: ${LEVEL_NAMES.join(', ')}`}>
          {([0, 1, 2, 3] as const).map((level) => (
            <span key={level} aria-hidden="true" className={`size-3 rounded-[3px] ${SHADE[level]}`} title={level === 0 ? undefined : `${HEAT_STEPS[level - 1]}+ min`} />
          ))}
        </span>
      </div>
    </Card>
  )
}
