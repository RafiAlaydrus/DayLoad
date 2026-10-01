import { addDays, parseDateKey, todayKey, weekStartKey } from '../lib/dates'
import type { DateKey } from '../types'
import { Card, SectionLabel } from './ui/Card'

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** This week, Monday to Sunday: a filled dot on each day you finished a workout or a cardio session. Real ones only. */
export function WeekStrip({ sessions }: { sessions: { date: DateKey }[] }) {
  const today = todayKey()
  const monday = weekStartKey(today)
  const trained = new Set(sessions.map((s) => s.date))
  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <SectionLabel>This week</SectionLabel>
        <span className="text-[13px] text-muted">
          {sessions.length === 0 ? 'No sessions yet' : `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`}
        </span>
      </div>
      <ul className="flex justify-between">
        {LETTERS.map((letter, i) => {
          const key = addDays(monday, i)
          const done = trained.has(key)
          const isToday = key === today
          const dayName = parseDateKey(key).toLocaleDateString(undefined, { weekday: 'long' })
          return (
            <li
              key={key}
              aria-label={`${dayName}${isToday ? ', today' : ''}${done ? ', trained' : ''}`}
              className={`flex h-[54px] w-[38px] flex-col items-center justify-center gap-1 rounded-chip border ${
                isToday ? 'border-ink bg-ink text-bg' : done ? 'border-border bg-surface-2 text-ink' : 'border-border text-muted'
              }`}
            >
              <span className="text-[11px] font-semibold">{letter}</span>
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${done ? (isToday ? 'bg-bg' : 'bg-ink') : 'bg-border'}`}
              />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
