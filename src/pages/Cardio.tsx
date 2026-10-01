import { ChevronLeft, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardioPicker } from '../components/CardioPicker'
import { BottomAction } from '../components/ui/BottomAction'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Field, FieldError } from '../components/ui/Field'
import { IconButton, IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { Segmented } from '../components/ui/Segmented'
import { discardCardio, finishCardio, logCardio, startCardio } from '../db/cardio'
import { useActiveCardio, useFinishedCardio, useSettings, useTimetableToday } from '../hooks/useData'
import { useNow } from '../hooks/useNow'
import { allowsSteps, CARDIO_KINDS, cardioLabel, defaultCardioDraft, goalProgress, goalText, type CardioDraft } from '../lib/cardio'
import { clock } from '../lib/format'
import { validateCardioGoal, validateCardioMinutes, validateOptionalSteps } from '../lib/validate'
import type { CardioGoal, CardioKind, CardioPlan, CardioSession } from '../types'

const MODES = [
  { value: 'now', label: 'Start now' },
  { value: 'log', label: 'Log one' },
] as const

export default function Cardio() {
  const active = useActiveCardio()
  const today = useTimetableToday()
  const settings = useSettings()
  const finished = useFinishedCardio()

  const header = (title: string) => (
    <div className="flex items-center gap-3">
      <IconLink to="/" label="Back to Home" outlined>
        <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
      </IconLink>
      <h1 className="font-display text-[30px] leading-none font-bold">{title}</h1>
    </div>
  )

  if (active === undefined || today === undefined || !settings || !finished) {
    return (
      <>
        {header('Cardio')}
        <Loading className="h-[300px]" />
      </>
    )
  }
  if (active) return <Running session={active} header={header('Cardio')} />
  return (
    <Start
      header={header('Cardio')}
      // Only Timetable mode follows the timetable (Adaptive mode picks muscles, not cardio).
      plan={settings.workoutMode === 'timetable' ? today?.cardio : undefined}
      lastKind={finished.at(-1)?.kind}
    />
  )
}

function Start({ header, plan, lastKind }: { header: ReactNode; plan?: CardioPlan; lastKind?: CardioKind }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'now' | 'log'>('now')
  const [draft, setDraft] = useState<CardioDraft>(
    plan ? { kind: plan.kind, type: plan.goal.type, text: String(plan.goal.value) } : defaultCardioDraft(lastKind),
  )
  const [minutes, setMinutes] = useState('')
  const [steps, setSteps] = useState('')
  const [errors, setErrors] = useState<{ goal?: string; minutes?: string; steps?: string }>({})
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)

  async function start() {
    // A blank goal is fine here: it is just a timer.
    const goal = draft.text.trim() === '' ? null : validateCardioGoal(draft.kind, draft.type, draft.text)
    setErrors({ goal: goal?.error })
    if (goal?.error !== undefined) return
    await save(() => startCardio(draft.kind, goal ? ({ type: draft.type, value: goal.value } as CardioGoal) : undefined))
  }

  async function log() {
    const m = validateCardioMinutes(minutes)
    const s = allowsSteps(draft.kind) ? validateOptionalSteps(steps) : { value: null }
    setErrors({ minutes: m.error, steps: s.error })
    if (m.error !== undefined || s.error !== undefined) return
    await save(async () => {
      await logCardio({ kind: draft.kind, minutes: m.value, steps: s.value })
      navigate('/')
    })
  }

  async function save(write: () => Promise<unknown>) {
    setBusy(true)
    setSaveError('')
    try {
      await write()
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
    }
    setBusy(false)
  }

  return (
    <>
      {header}
      <Segmented legend="What to do" hideLegend filled name="cardio-mode" value={mode} options={MODES} onChange={setMode} />

      {mode === 'now' ? (
        <Card>
          <SectionLabel>{plan ? 'From your timetable' : 'Set it up'}</SectionLabel>
          <div className="mt-4">
            <CardioPicker name="start" value={draft} onChange={setDraft} goalOptional error={errors.goal} />
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <SectionLabel>One you already did</SectionLabel>
          <Segmented
            legend="Type"
            name="log-kind"
            wrap
            value={draft.kind}
            options={CARDIO_KINDS.map((k) => ({ value: k.id, label: k.label }))}
            onChange={(kind) => setDraft({ ...draft, kind })}
          />
          <Field label="Minutes" suffix="min" inputMode="numeric" autoComplete="off" value={minutes} onChange={(e) => setMinutes(e.target.value)} error={errors.minutes} />
          {allowsSteps(draft.kind) && (
            <Field
              label="Steps (optional)"
              suffix="steps"
              inputMode="numeric"
              autoComplete="off"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              error={errors.steps}
            />
          )}
        </Card>
      )}

      {saveError && <FieldError>{saveError}</FieldError>}
      <BottomAction>
        <Button size="lg" disabled={busy} onClick={mode === 'now' ? start : log}>
          {mode === 'now' ? 'Start cardio' : 'Save cardio'}
        </Button>
      </BottomAction>
    </>
  )
}

/** Minutes and seconds since it started. Its own component so only this re-renders each second. */
function Elapsed({ session }: { session: CardioSession }) {
  const now = useNow(1000)
  const seconds = (now - session.startedAt) / 1000
  const progress = goalProgress(session.goal, seconds / 60)
  const left = session.goal?.type === 'minutes' ? Math.max(0, Math.ceil(session.goal.value - seconds / 60)) : null
  return (
    <Card className="flex flex-col items-center gap-3 py-8">
      <SectionLabel>{cardioLabel(session.kind)}</SectionLabel>
      <p className="font-display text-[88px] leading-none font-bold tabular-nums" aria-live="off">
        {clock(seconds)}
      </p>
      {session.goal && (
        <div className="mt-2 w-full">
          {session.goal.type === 'minutes' && (
            <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              {/* Transform only, and one second long so the bar glides between ticks. */}
              <div
                className="h-full origin-left rounded-full bg-ink transition-transform duration-1000 ease-linear"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          )}
          <p className="mt-2 text-center text-[13px] text-muted">
            Goal {goalText(session.goal)}
            {left !== null && (left === 0 ? '. Goal reached.' : `. ${left} min to go.`)}
          </p>
        </div>
      )}
    </Card>
  )
}

function Running({ session, header }: { session: CardioSession; header: ReactNode }) {
  const navigate = useNavigate()
  const [finishing, setFinishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [steps, setSteps] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function finish() {
    const s = allowsSteps(session.kind) ? validateOptionalSteps(steps) : { value: null }
    if (s.error !== undefined) {
      setError(s.error)
      return
    }
    setBusy(true)
    try {
      await finishCardio(session, s.value)
      navigate('/')
    } catch {
      setError('Could not save. Check that this phone has free storage, then try again.')
      setBusy(false)
    }
  }

  async function discard() {
    await discardCardio(session.id!)
    navigate('/')
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        {header}
        <IconButton label="Discard this session" outlined onClick={() => setDiscarding(true)}>
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </div>
      <Elapsed session={session} />
      <p className="text-[13px] leading-relaxed text-muted">
        The timer keeps counting if you lock the phone or close the app. Tap Finish when you are done.
      </p>
      <BottomAction>
        <Button size="lg" onClick={() => setFinishing(true)}>
          Finish
        </Button>
      </BottomAction>

      <BottomSheet open={finishing} onClose={() => setFinishing(false)} title="Finish cardio">
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-relaxed text-muted">
            {cardioLabel(session.kind)}, saved as the time on the clock.
            {session.goal?.type === 'steps' && ` Your goal was ${goalText(session.goal)}.`}
          </p>
          {allowsSteps(session.kind) && (
            <Field
              label="Steps (optional)"
              suffix="steps"
              inputMode="numeric"
              autoComplete="off"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              error={error}
            />
          )}
          {!allowsSteps(session.kind) && error && <FieldError>{error}</FieldError>}
          <Button onClick={finish} disabled={busy}>
            Save cardio
          </Button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={discarding}
        title="Discard this session?"
        message="Nothing is saved from it. If you already did the cardio, finish it instead."
        confirmLabel="Discard"
        onConfirm={discard}
        onCancel={() => setDiscarding(false)}
      />
    </>
  )
}
