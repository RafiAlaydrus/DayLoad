import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActivityCard } from '../components/ActivityCard'
import { CardioCard } from '../components/CardioCard'
import { HeroArt } from '../components/HeroArt'
import { LogoMark } from '../components/LogoMark'
import { WeekStrip } from '../components/WeekStrip'
import { ButtonLink } from '../components/ui/Button'
import { Card, CardLink, SectionLabel } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Measure } from '../components/ui/Measure'
import {
  useActiveSession,
  useBodyLogs,
  useCardioBetween,
  useFinishedSessions,
  useSettings,
  useTimetableToday,
  useWeekSessions,
} from '../hooks/useData'
import { REST_AFTER_DAYS, trainingStreak } from '../lib/adaptive'
import { isRestDay } from '../lib/cardio'
import { addDays, formatDate, todayKey, weekStartKey } from '../lib/dates'
import { groupsLabel, groupsOf } from '../lib/recommend'
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
      <CardioCard />
      <RestSuggestion />
      <Week />
      <ActivityCard />
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

/** Only appears in Timetable mode, when today's row is set (Plan tab). Adaptive mode does not use the timetable. */
function TodayPlan() {
  const entry = useTimetableToday()
  const settings = useSettings()
  if (!entry || settings?.workoutMode !== 'timetable') return null
  return (
    <p className="font-display text-[40px] font-bold leading-none">
      {isRestDay(entry)
        ? 'Today is a rest day'
        : groupsOf(entry).length === 0
          ? 'Today is a cardio day'
          : `Today is ${groupsLabel(groupsOf(entry)).toLowerCase()} day${entry.cardio ? ', plus cardio' : ''}`}
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
      {/* A big faint barbell bleeding off the corner (DESIGN.md). The logo mark stays in the header. */}
      <HeroArt kind="barbell" className="pointer-events-none absolute -right-16 -bottom-5 w-[290px] -rotate-[16deg] opacity-[0.22]" />
      {/* Ink, not muted: muted text on the taupe accent fails WCAG AA contrast. */}
      <p className="relative text-[13px] font-semibold uppercase tracking-[0.08em]">
        {active ? 'Workout in progress' : 'Ready when you are'}
      </p>
      <div className="relative">
        <h1 className="font-display text-[46px] font-bold leading-[0.95]">{active ? 'Continue workout' : 'Hit the gym'}</h1>
        {/* A span, not a button: the whole card is the link. The arrow says it opens a new screen. */}
        <span className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-bg">
          {active ? `${groupsLabel(groupsOf(active))}, exercise ${Math.min(active.currentIndex + 1, total)} of ${total}` : 'Start session'}
          <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function Week() {
  const sessions = useWeekSessions()
  const monday = weekStartKey(todayKey())
  const cardio = useCardioBetween(monday, addDays(monday, 6))
  if (!sessions || !cardio) return <Loading className="h-[122px]" />
  // A cardio session fills a day of the week like a workout does.
  return <WeekStrip sessions={[...sessions, ...cardio]} />
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
