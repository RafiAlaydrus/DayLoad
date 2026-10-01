import { useParams } from 'react-router-dom'
import { BottomAction } from '../components/ui/BottomAction'
import { ButtonLink } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Measure } from '../components/ui/Measure'
import { useExercises, useGyms, useHistory, useSession, useSessionSets, useSettings } from '../hooks/useData'
import { formatDate } from '../lib/dates'
import { bestText, newRecords } from '../lib/progress'
import { groupsLabel, groupsOf } from '../lib/recommend'
import { fromKg, loadText } from '../lib/units'
import type { WeightUnit } from '../types'

export default function Summary() {
  const id = Number(useParams().sessionId)
  const session = useSession(id)
  const sets = useSessionSets(Number.isInteger(id) ? id : undefined)
  const exercises = useExercises()
  const gyms = useGyms()
  const settings = useSettings()
  const history = useHistory()

  if (session === undefined || !sets || !exercises || !gyms || !settings || !history) {
    return (
      <>
        <Loading className="h-11" />
        <Loading className="h-[120px]" />
        <Loading className="h-[200px]" />
      </>
    )
  }
  if (session === null) {
    return (
      <>
        <h1 className="font-display text-[34px] font-bold leading-none">Session summary</h1>
        <Card>
          <p className="text-[15px] leading-relaxed">There is no workout with that number.</p>
          <ButtonLink to="/" className="mt-4">
            Back to Home
          </ButtonLink>
        </Card>
      </>
    )
  }
  if (session.finishedAt === undefined) {
    return (
      <>
        <h1 className="font-display text-[34px] font-bold leading-none">Session summary</h1>
        <Card>
          <p className="text-[15px] leading-relaxed">This workout is still in progress.</p>
          <ButtonLink to="/workout" className="mt-4">
            Continue workout
          </ButtonLink>
        </Card>
      </>
    )
  }

  const unit: WeightUnit = settings.weightUnit
  const name = new Map(exercises.map((e) => [e.id, e.name]))
  // Exercises in the order they were first logged, so a swap mid-workout shows what was really done.
  const done = [...new Set(sets.map((s) => s.exerciseId))]
  const skipped = session.exerciseIds.filter((eid) => !done.includes(eid))
  const volumeKg = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
  const gym = gyms.find((g) => g.id === session.gymId)
  const records = newRecords(history, session)

  return (
    <>
      <div>
        <p className="text-[13px] font-semibold text-muted">
          {formatDate(session.date, { weekday: true })} · {gym?.name ?? 'Removed gym'}
        </p>
        <h1 className="mt-1 font-display text-[44px] font-bold leading-[0.95]">{groupsLabel(groupsOf(session))} day done</h1>
      </div>

      <div className="grid auto-cols-fr grid-flow-col gap-2.5">
        <Card compact>
          <SectionLabel>Time</SectionLabel>
          <div className="mt-1 text-[28px] leading-none">
            <Measure parts={[[String(session.durationMin), 'min']]} />
          </div>
        </Card>
        <Card compact>
          <SectionLabel>Sets</SectionLabel>
          <div className="mt-1 font-display text-[28px] font-bold leading-none">{sets.length}</div>
        </Card>
        {volumeKg > 0 && (
          <Card compact>
            <SectionLabel>Volume</SectionLabel>
            <div className="mt-1 text-[28px] leading-none">
              <Measure parts={[[String(Math.round(fromKg(volumeKg, unit))), unit]]} />
            </div>
          </Card>
        )}
      </div>

      {records.length > 0 && (
        <Card>
          <SectionLabel>{records.length === 1 ? 'New record' : 'New records'}</SectionLabel>
          <ul>
            {records.map((r) => (
              <li key={r.exerciseId} className="border-t border-border py-3 first:mt-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-bold">{name.get(r.exerciseId) ?? 'Removed exercise'}</p>
                  <p className="shrink-0 text-[15px] font-bold">{bestText(r.now, unit)}</p>
                </div>
                <p className="mt-1 text-[13px] text-muted">Beat {bestText(r.before, unit)}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <SectionLabel>What you did</SectionLabel>
        <ul>
          {done.map((eid) => (
            <li key={eid} className="border-t border-border py-3 first:mt-1.5">
              <p className="text-[15px] font-bold">{name.get(eid) ?? 'Removed exercise'}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {sets
                  .filter((s) => s.exerciseId === eid)
                  .map((s) => (s.weightKg > 0 ? `${loadText(s.weightKg, unit)} ${unit} × ${s.reps}` : `${s.reps} reps`))
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ul>
        {skipped.length > 0 && (
          <p className="border-t border-border pt-3 text-[13px] leading-relaxed text-muted">
            Skipped: {skipped.map((eid) => name.get(eid) ?? 'Removed exercise').join(', ')}
          </p>
        )}
      </Card>

      <BottomAction>
        <ButtonLink to="/" size="lg">
          Done
        </ButtonLink>
      </BottomAction>
    </>
  )
}
