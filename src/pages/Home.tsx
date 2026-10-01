import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/LogoMark'
import { WeekStrip } from '../components/WeekStrip'
import { ButtonLink } from '../components/ui/Button'
import { Card, CardLink, SectionLabel } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Measure } from '../components/ui/Measure'
import {
  useActiveSession,
  useBodyLogs,
  useFinishedSessions,
  useSettings,
  useTimetableToday,
  useWeekSessions,
} from '../hooks/useData'
import { REST_AFTER_DAYS, trainingStreak } from '../lib/adaptive'
import { formatDate, todayKey } from '../lib/dates'
import { muscleLabel } from '../lib/recommend'
import { STREAK_MIN, weeklyStreak } from '../lib/streak'
import { weightParts } from '../lib/units'

export default function Home() {
  const today = todayKey()
  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-display text-2xl font-bold tracking-[0.02em]">DayLoad</span>
        </div>
        <time dateTime={today} className="text-[13px] font-semibold text-muted">
          {formatDate(today, { weekday: true })}
        </time>
      </header>

      <TodayPlan />
      <Hero />
      <RestSuggestion />
      <Week />
      <Streak />
      <LatestWeight />
    </>
  )
}

/** After enough training days in a row, a short card says so. Same rule as on Hit the gym, in both modes. */
function RestSuggestion() {
  const sessions = useFinishedSessions()
  const active = useActiveSession()
  // Nothing until both are read. A workout in progress makes the suggestion moot.
  if (!sessions || active === undefined || active) return null
  const days = trainingStreak(sessions, todayKey())
  if (days < REST_AFTER_DAYS) return null
  return (
    <Card compact>
      <SectionLabel>Rest day suggested</SectionLabel>
      <p className="mt-1.5 text-[15px] leading-relaxed">You trained {days} days in a row. It is your call, you can still train today.</p>
    </Card>
  )
}

/** Weeks in a row with at least 3 finished workouts. A week still running never breaks it. */
function Streak() {
  const sessions = useFinishedSessions()
  if (!sessions) return <Loading className="h-[100px]" />
  const { weeks, thisWeek } = weeklyStreak(sessions, todayKey())
  return (
    <Card>
      <SectionLabel>Streak</SectionLabel>
      {weeks === 0 ? (
        <p className="mt-2 text-[15px] font-semibold">No streak yet</p>
      ) : (
        <Measure parts={[[String(weeks), weeks === 1 ? 'week' : 'weeks']]} className="mt-1.5 block text-[38px] leading-none" />
      )}
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {thisWeek >= STREAK_MIN
          ? 'This week is done.'
          : `${thisWeek} of ${STREAK_MIN} workouts this week. A week with ${STREAK_MIN} or more adds to your streak.`}
      </p>
    </Card>
  )
}

/** Only appears in Timetable mode, when today's row is set (Plan tab). Adaptive mode does not use the timetable. */
function TodayPlan() {
  const entry = useTimetableToday()
  const settings = useSettings()
  if (!entry || settings?.workoutMode !== 'timetable') return null
  return (
    <p className="font-display text-[40px] font-bold leading-none">
      {entry.muscleGroup ? `Today is ${entry.muscleGroup} day` : 'Today is a rest day'}
    </p>
  )
}

/** The one focal point on Home: start a session, or pick the running one back up. */
function Hero() {
  const active = useActiveSession()
  if (active === undefined) return <Loading className="h-[190px]" />

  const total = active?.exerciseIds.length ?? 0
  return (
    <Link
      to={active ? '/workout' : '/hit-the-gym'}
      className="press relative flex h-[190px] flex-col justify-between overflow-hidden rounded-hero bg-accent p-[22px]"
    >
      {/* The logo mark bleeding off the corner is the identity motif (DESIGN.md). */}
      <LogoMark size={210} className="pointer-events-none absolute -right-6 -bottom-[30px] opacity-[0.22]" />
      {/* Ink, not muted: muted text on the taupe accent fails WCAG AA contrast. */}
      <p className="relative text-[13px] font-semibold uppercase tracking-[0.08em]">
        {active ? 'Workout in progress' : 'Ready when you are'}
      </p>
      <div className="relative">
        <h1 className="font-display text-[46px] font-bold leading-[0.95]">{active ? 'Continue workout' : 'Hit the gym'}</h1>
        {/* A span, not a button: the whole card is the link. The arrow says it opens a new screen. */}
        <span className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-bg">
          {active ? `${muscleLabel(active.muscleGroup)}, exercise ${Math.min(active.currentIndex + 1, total)} of ${total}` : 'Start session'}
          <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function Week() {
  const sessions = useWeekSessions()
  if (!sessions) return <Loading className="h-[122px]" />
  return <WeekStrip sessions={sessions} />
}

function LatestWeight() {
  const logs = useBodyLogs()
  const settings = useSettings()

  if (!logs || !settings) return <Loading className="h-[112px]" />

  const latest = logs.at(-1)
  if (!latest) {
    return (
      <Card>
        <SectionLabel>Latest weight</SectionLabel>
        <p className="mt-2 text-[15px] font-semibold">No weight logged yet</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">Add your first one to start a trend line.</p>
        <ButtonLink to="/profile" className="mt-4">
          Add first weight
        </ButtonLink>
      </Card>
    )
  }

  return (
    <CardLink to="/profile">
      <SectionLabel>Latest weight</SectionLabel>
      <Measure parts={weightParts(latest.weightKg, settings.weightUnit)} className="mt-1.5 block text-[38px] leading-none" />
      <p className="mt-2 text-[13px] text-muted">Logged {formatDate(latest.date, { weekday: true })}</p>
    </CardLink>
  )
}
