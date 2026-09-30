import { LogoMark } from '../components/LogoMark'
import { ButtonLink } from '../components/ui/Button'
import { Card, CardLink, SectionLabel } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Measure } from '../components/ui/Measure'
import { useBodyLogs, useSettings } from '../hooks/useData'
import { formatDate, todayKey } from '../lib/dates'
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

      <Hero />
      <LatestWeight />
    </>
  )
}

/** The one focal point on Home. Its button comes alive in Phase 2. */
function Hero() {
  return (
    <section className="relative flex h-[190px] flex-col justify-between overflow-hidden rounded-hero bg-accent p-[22px]">
      {/* The logo mark bleeding off the corner is the identity motif (DESIGN.md). */}
      <LogoMark size={210} className="pointer-events-none absolute -right-6 -bottom-[30px] opacity-[0.22]" />
      {/* Ink, not muted: muted text on the taupe accent fails WCAG AA contrast. */}
      <p className="relative text-[13px] font-semibold uppercase tracking-[0.08em]">Next session</p>
      <div className="relative">
        <h1 className="font-display text-[46px] font-bold leading-[0.95]">Hit the gym</h1>
        {/* TODO(phase 2): make this a link that starts a session. It stays disabled and labeled until then. */}
        <button
          type="button"
          disabled
          className="mt-2 inline-flex min-h-11 items-center rounded-full border border-ink/60 px-4 text-sm font-bold text-ink"
        >
          Coming in Phase 2
        </button>
      </div>
    </section>
  )
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
