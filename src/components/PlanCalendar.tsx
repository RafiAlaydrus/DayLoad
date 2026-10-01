import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGyms, useSessionsBetween, useSettings, useTimetable } from '../hooks/useData'
import { addMonths, monthWeeks, plannedFor, WEEK_ORDER } from '../lib/calendar'
import { addDays, formatDate, todayKey, weekdayName } from '../lib/dates'
import { groupsLabel, groupsOf } from '../lib/recommend'
import type { DateKey, Gym, Session, TimetableDay } from '../types'
import { AdaptiveNote } from './AdaptiveNote'
import { Card, SectionLabel } from './ui/Card'
import { IconButton } from './ui/IconButton'
import { Loading } from './ui/Loading'

// A swipe must travel this far sideways and stay mostly level, so scrolling the page never turns the month.
const SWIPE_X = 60
const SWIPE_Y = 40

/** One month at a time: a dot on days you trained, a ring on days the timetable plans a workout, and a panel for the day you tap. */
export function PlanCalendar() {
  const today = todayKey()
  const [month, setMonth] = useState(addMonths(today, 0))
  const [selected, setSelected] = useState<DateKey>(today)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const sessions = useSessionsBetween(month, addDays(addMonths(month, 1), -1))
  const rows = useTimetable()
  const gyms = useGyms()
  const settings = useSettings()

  const thisMonth = addMonths(today, 0)
  const go = (months: number) => {
    const next = addMonths(month, months)
    setMonth(next)
    // Land on today in the current month, otherwise on the 1st, so the panel always has a day in view.
    setSelected(next === thisMonth ? today : next)
  }
  const backToToday = () => {
    setMonth(thisMonth)
    setSelected(today)
  }

  const title = new Date(`${month}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const ready = sessions && rows && gyms && settings
  const timetableMode = settings?.workoutMode === 'timetable'

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <IconButton label="Previous month" outlined onClick={() => go(-1)}>
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </IconButton>
        <div className="text-center">
          <h2 className="font-display text-[28px] font-bold leading-none" aria-live="polite">
            {title}
          </h2>
          {month !== thisMonth && (
            <button type="button" onClick={backToToday} className="press mt-0.5 min-h-11 px-3 text-[13px] font-bold text-ink underline">
              Back to today
            </button>
          )}
        </div>
        <IconButton label="Next month" outlined onClick={() => go(1)}>
          <ChevronRight size={22} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </div>

      {!ready ? (
        <>
          <Loading className="h-[300px]" />
          <Loading className="h-[110px]" />
        </>
      ) : (
        <>
          {settings.workoutMode === 'adaptive' && <AdaptiveNote what="a plan for coming days" />}

          <div
            onTouchStart={(e) => {
              touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            }}
            onTouchEnd={(e) => {
              const start = touch.current
              touch.current = null
              if (!start) return
              const dx = e.changedTouches[0].clientX - start.x
              const dy = e.changedTouches[0].clientY - start.y
              if (Math.abs(dx) > SWIPE_X && Math.abs(dy) < SWIPE_Y) go(dx < 0 ? 1 : -1)
            }}
          >
            <div aria-hidden="true" className="mb-1.5 grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-muted">
              {WEEK_ORDER.map((day) => (
                <span key={day}>{weekdayName(day)[0]}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {monthWeeks(month)
                .flat()
                .map((key, i) =>
                  key ? (
                    <DayCell
                      key={key}
                      day={key}
                      today={today}
                      selected={key === selected}
                      trained={sessions.filter((s) => s.date === key)}
                      planned={timetableMode && key >= today ? plannedFor(key, rows) : undefined}
                      onSelect={() => setSelected(key)}
                    />
                  ) : (
                    <div key={`empty-${i}`} />
                  ),
                )}
            </div>
          </div>

          <Legend showPlanned={timetableMode} />

          <DayPanel
            day={selected}
            today={today}
            sessions={sessions.filter((s) => s.date === selected)}
            plan={plannedFor(selected, rows)}
            timetableMode={timetableMode}
            gyms={gyms}
          />
        </>
      )}
    </>
  )
}

interface CellProps {
  day: DateKey
  today: DateKey
  selected: boolean
  trained: Session[]
  /** The timetable row, only for today and later and only in Timetable mode. */
  planned: TimetableDay | undefined
  onSelect: () => void
}

function DayCell({ day, today, selected, trained, planned, onSelect }: CellProps) {
  const isToday = day === today
  const plannedGroups = planned ? groupsOf(planned) : []
  const status = trained.length > 0 ? 'trained' : plannedGroups.length > 0 ? 'planned' : null
  const label = [
    formatDate(day, { weekday: true }),
    isToday ? 'today' : '',
    trained.length > 0 ? `trained ${trained.map((s) => groupsLabel(groupsOf(s)).toLowerCase()).join(' and ')}` : '',
    trained.length === 0 && plannedGroups.length > 0 ? `planned ${groupsLabel(plannedGroups).toLowerCase()}` : '',
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      aria-current={isToday ? 'date' : undefined}
      onClick={onSelect}
      className={`press flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl border ${
        isToday ? 'border-ink bg-ink text-bg' : selected ? 'border-ink bg-surface-2' : 'border-border'
      }`}
    >
      <span className="font-display text-[19px] leading-none font-bold">{Number(day.slice(8))}</span>
      {/* A filled dot is a workout done, a ring is one planned, nothing is a day off or not set. */}
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          status === 'trained'
            ? isToday
              ? 'bg-bg'
              : 'bg-ink'
            : status === 'planned'
              ? `border-[1.5px] ${isToday ? 'border-bg' : 'border-ink'}`
              : ''
        }`}
      />
    </button>
  )
}

function Legend({ showPlanned }: { showPlanned: boolean }) {
  return (
    <p className="flex items-center gap-4 text-[13px] text-muted">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-ink" />
        Trained
      </span>
      {showPlanned && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full border-[1.5px] border-ink" />
          Planned
        </span>
      )}
    </p>
  )
}

interface PanelProps {
  day: DateKey
  today: DateKey
  sessions: Session[]
  plan: TimetableDay | undefined
  timetableMode: boolean
  gyms: Gym[]
}

/** What happened on the chosen day, and for today and later, what the timetable says. */
function DayPanel({ day, today, sessions, plan, timetableMode, gyms }: PanelProps) {
  const gymName = (id?: string) => gyms.find((g) => g.id === id)?.name
  const upcoming = day >= today
  const planText = !plan
    ? 'Nothing set for this weekday.'
    : groupsOf(plan).length > 0
      ? `${groupsLabel(groupsOf(plan))}${gymName(plan.defaultGymId) ? ` at ${gymName(plan.defaultGymId)}` : ''}`
      : 'Rest day'

  return (
    <Card>
      <SectionLabel>{day === today ? `Today, ${formatDate(day, { weekday: true })}` : formatDate(day, { weekday: true })}</SectionLabel>

      {sessions.length > 0 && (
        <ul className="mt-1.5">
          {sessions.map((s) => (
            <li key={s.id} className="border-t border-border first:border-t-0">
              <Link to={`/summary/${s.id}`} className="press flex min-h-14 items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold">{groupsLabel(groupsOf(s))} day</span>
                  <span className="block truncate text-[13px] text-muted">
                    {s.durationMin} min · {gymName(s.gymId) ?? 'Removed gym'}
                  </span>
                </span>
                <ChevronRight size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {upcoming && timetableMode && (
        <p className={`text-[15px] leading-relaxed ${sessions.length > 0 ? 'mt-1 border-t border-border pt-3' : 'mt-1.5'}`}>
          <span className="text-muted">Planned: </span>
          <span className="font-semibold">{planText}</span>
        </p>
      )}

      {sessions.length === 0 && !upcoming && <p className="mt-1.5 text-[15px] text-muted">No workout logged.</p>}
      {sessions.length === 0 && upcoming && !timetableMode && (
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">Adaptive mode picks the muscle group when you hit the gym.</p>
      )}
    </Card>
  )
}
