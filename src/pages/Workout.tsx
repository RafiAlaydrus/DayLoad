import { ArrowLeftRight, BookOpen, Plus, X } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HowTo } from '../components/HowTo'
import { REST_SECONDS, RestTimer } from '../components/RestTimer'
import { SetRow } from '../components/SetRow'
import { BottomAction } from '../components/ui/BottomAction'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FieldError } from '../components/ui/Field'
import { IconButton } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { discardSession, finishSession, goToExercise, logSet, swapExercise, unlogSet } from '../db/sessions'
import { useActiveSession, useEquipment, useExercises, useGyms, useHistory, useSessionSets, useSettings } from '../hooks/useData'
import { useNow } from '../hooks/useNow'
import { clock, listNames, secondsFromNow } from '../lib/format'
import { lastSets, overloadTarget, targetText } from '../lib/progress'
import { muscleLabel, swapOptions } from '../lib/recommend'
import { loadText } from '../lib/units'
import { validateLoad, validateReps } from '../lib/validate'
import type { Exercise, Gym, Session, WeightUnit } from '../types'

export default function Workout() {
  const session = useActiveSession()
  const exercises = useExercises()
  const gyms = useGyms()
  const equipment = useEquipment()
  const settings = useSettings()

  if (session === undefined || !exercises || !gyms || !equipment || !settings) {
    return (
      <>
        <Loading className="h-11" />
        <Loading className="h-[300px]" />
      </>
    )
  }
  if (session === null) {
    return (
      <>
        <h1 className="font-display text-[34px] font-bold leading-none">Workout</h1>
        <Card>
          <p className="text-[15px] leading-relaxed">No workout in progress.</p>
          <ButtonLink to="/hit-the-gym" className="mt-4">
            Hit the gym
          </ButtonLink>
        </Card>
      </>
    )
  }
  return (
    <WorkoutView
      session={session}
      exercises={exercises}
      gym={gyms.find((g) => g.id === session.gymId)}
      equipmentName={new Map(equipment.map((e) => [e.id, e.name]))}
      unit={settings.weightUnit}
      avoidIds={settings.avoidIds}
    />
  )
}

/** Minutes and seconds since the session started. Its own component so only this text re-renders each second. */
function Elapsed({ startedAt }: { startedAt: number }) {
  const now = useNow(1000)
  return <>{clock((now - startedAt) / 1000)}</>
}

interface Draft {
  weight: string
  reps: string
}

interface ViewProps {
  session: Session
  exercises: Exercise[]
  gym: Gym | undefined
  equipmentName: Map<string, string>
  unit: WeightUnit
  avoidIds: string[]
}

function WorkoutView({ session, exercises, gym, equipmentName, unit, avoidIds }: ViewProps) {
  const navigate = useNavigate()
  const sets = useSessionSets(session.id)
  const history = useHistory()
  // What has been typed but not logged yet. A logged set lives in the database, so a draft is dropped when it is logged.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [extraRows, setExtraRows] = useState<Record<string, number>>({})
  const [rowError, setRowError] = useState<{ key: string; message: string } | null>(null)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [sheet, setSheet] = useState<'swap' | 'howto' | null>(null)
  const [ending, setEnding] = useState(false)
  const [actionError, setActionError] = useState('')
  const stopRest = useCallback(() => setRestEndsAt(null), [])

  if (!sets || !history) return <Loading className="h-[300px]" />

  const total = session.exerciseIds.length
  const index = Math.min(session.currentIndex, total - 1)
  const current = exercises.find((e) => e.id === session.exerciseIds[index])
  // From the last finished session with this exercise. The workout in progress is not history yet.
  const target = current ? overloadTarget(lastSets(history, current.id), unit) : null
  const isLast = index >= total - 1
  const setsHere = current ? sets.filter((s) => s.exerciseId === current.id) : []
  const byOrder = new Map(setsHere.map((s) => [s.order, s]))
  const showWeight = current ? current.equipmentIds.length > 0 : false
  const key = (i: number) => `${current?.id}:${i}`

  const rowCount = Math.max(
    session.setsPerExercise + (current ? (extraRows[current.id] ?? 0) : 0),
    setsHere.length > 0 ? Math.max(...setsHere.map((s) => s.order)) + 1 : 0,
  )
  const firstOpen = Array.from({ length: rowCount }, (_, i) => i).find((i) => !byOrder.has(i))

  // A row shows what was typed, else what was logged, else the row above it (so one entry fills the rest).
  // The first row starts at the target, so following the target takes one tap per set.
  const valueAt = (i: number): Draft => {
    const draft = drafts[key(i)]
    if (draft) return draft
    const logged = byOrder.get(i)
    if (logged) return { weight: loadText(logged.weightKg, unit), reps: String(logged.reps) }
    if (i > 0) return valueAt(i - 1)
    return target ? { weight: loadText(target.weightKg, unit), reps: String(target.reps) } : { weight: '', reps: '' }
  }

  async function toggle(i: number) {
    if (!current) return
    setRowError(null)
    try {
      const logged = byOrder.get(i)
      if (logged) {
        // Un-logging keeps the values in the row so they can be corrected and logged again.
        const values = valueAt(i)
        await unlogSet(session.id!, current.id, i)
        setDrafts((d) => ({ ...d, [key(i)]: values }))
        return
      }
      const values = valueAt(i)
      const reps = validateReps(values.reps)
      const load = validateLoad(unit, showWeight ? values.weight : '')
      if (reps.error !== undefined || load.error !== undefined) {
        setRowError({ key: key(i), message: reps.error ?? load.error! })
        return
      }
      await logSet({ sessionId: session.id!, exerciseId: current.id, reps: reps.value, weightKg: load.value, order: i })
      setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== key(i))))
      setRestEndsAt(secondsFromNow(REST_SECONDS))
    } catch {
      setRowError({ key: key(i), message: 'Could not save that set. Try again.' })
    }
  }

  async function run(action: () => Promise<unknown>) {
    setActionError('')
    try {
      await action()
    } catch {
      setActionError('Could not save that. Check that this phone has free storage, then try again.')
    }
  }

  /** Finishing keeps the session and shows its summary. With nothing logged there is nothing to keep, so it is removed. */
  async function end() {
    setEnding(false)
    if (sets!.length > 0) {
      await run(async () => {
        await finishSession(session)
        navigate(`/summary/${session.id}`, { replace: true })
      })
    } else {
      await run(async () => {
        await discardSession(session)
        navigate('/', { replace: true })
      })
    }
  }

  const options = current ? swapOptions(exercises, current, session.exerciseIds, gym?.equipmentIds ?? [], avoidIds) : []
  const nextLabel = isLast ? 'Finish workout' : setsHere.length > 0 ? 'Next exercise' : 'Skip exercise'

  return (
    <>
      <div className="flex items-center justify-between">
        <IconButton label="End session" outlined onClick={() => setEnding(true)}>
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </IconButton>
        <span className="text-sm font-bold text-muted">
          Exercise {index + 1} of {total} · <Elapsed startedAt={session.startedAt} />
        </span>
        <IconButton label="Swap exercise" outlined onClick={() => setSheet('swap')} disabled={!current}>
          <ArrowLeftRight size={20} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </div>

      <div role="progressbar" aria-label="Workout progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} className="flex gap-1.5">
        {session.exerciseIds.map((id, i) => (
          <div
            key={`${id}-${i}`}
            className={`h-[5px] flex-1 rounded-[3px] ${i < index ? 'bg-ink' : i === index ? 'bg-muted' : 'bg-border'}`}
          />
        ))}
      </div>

      {current ? (
        <>
          <div>
            <p className="text-[13px] font-semibold text-muted">
              {muscleLabel(current.muscleGroup)} · {listNames(current.equipmentIds.map((id) => equipmentName.get(id) ?? id)) || 'Bodyweight'}
            </p>
            <h1 className="mt-1 font-display text-[44px] font-bold leading-[0.95]">{current.name}</h1>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-3">
            <span className="shrink-0 rounded-lg bg-ink px-2 py-1 text-xs font-bold uppercase tracking-[0.06em] text-bg">Target</span>
            <p className="text-sm leading-snug">
              {target ? targetText(target, unit) : 'No history yet. What you log today sets your first target.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSheet('howto')}
            className="press flex min-h-12 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 text-left text-sm font-semibold"
          >
            <BookOpen size={18} strokeWidth={2} aria-hidden="true" className="text-muted" />
            How to do this exercise
          </button>

          <div className="flex flex-col gap-2">
            {Array.from({ length: rowCount }, (_, i) => (
              <SetRow
                key={key(i)}
                number={i + 1}
                unit={unit}
                showWeight={showWeight}
                weight={valueAt(i).weight}
                reps={valueAt(i).reps}
                logged={byOrder.has(i)}
                current={i === firstOpen}
                error={rowError?.key === key(i) ? rowError.message : undefined}
                onChange={(patch) => setDrafts((d) => ({ ...d, [key(i)]: { ...valueAt(i), ...patch } }))}
                onToggle={() => toggle(i)}
              />
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => setExtraRows((e) => ({ ...e, [current.id]: (e[current.id] ?? 0) + 1 }))}
            >
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              Add set
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <SectionLabel>Exercise unavailable</SectionLabel>
          <p className="mt-2 text-[15px] leading-relaxed">This exercise is no longer in the library. Skip it to keep going.</p>
        </Card>
      )}

      {actionError && <FieldError>{actionError}</FieldError>}

      <BottomAction>
        <AnimatePresence>{restEndsAt !== null && <RestTimer key="rest" endsAt={restEndsAt} onDone={stopRest} />}</AnimatePresence>
        <Button
          size="lg"
          variant={isLast || setsHere.length > 0 ? 'primary' : 'secondary'}
          onClick={() => (isLast ? (sets.length > 0 ? end() : setEnding(true)) : run(() => goToExercise(session.id!, index + 1)))}
        >
          {nextLabel}
        </Button>
      </BottomAction>

      <BottomSheet open={sheet === 'howto' && current !== undefined} onClose={() => setSheet(null)} title={current?.name ?? ''}>
        {current && <HowTo exercise={current} />}
      </BottomSheet>

      <BottomSheet open={sheet === 'swap'} onClose={() => setSheet(null)} title="Swap exercise">
        {options.length === 0 ? (
          <p className="text-[15px] leading-relaxed text-muted">No other exercise for this muscle fits this gym.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSheet(null)
                    void run(() => swapExercise(session, index, option.id))
                  }}
                  className="press flex min-h-14 w-full flex-col items-start justify-center rounded-2xl border border-border bg-bg px-4 py-2 text-left"
                >
                  <span className="text-base font-bold">{option.name}</span>
                  <span className="text-[13px] text-muted">
                    {listNames(option.equipmentIds.map((id) => equipmentName.get(id) ?? id)) || 'Bodyweight'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={ending}
        title={sets.length > 0 ? 'End this workout?' : 'Discard this workout?'}
        message={
          sets.length > 0
            ? `Your ${sets.length} logged ${sets.length === 1 ? 'set is' : 'sets are'} saved. The workout ends now and you see its summary.`
            : 'Nothing is logged yet, so this workout will be removed.'
        }
        confirmLabel={sets.length > 0 ? 'End workout' : 'Discard workout'}
        onConfirm={end}
        onCancel={() => setEnding(false)}
      />
    </>
  )
}
