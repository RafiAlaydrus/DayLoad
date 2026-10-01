import { AnimatePresence, motion, type Variants } from 'motion/react'
import { ArrowRight, Check, ChevronLeft, Flame, Target, Trophy } from 'lucide-react'
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { PROFILE_ID, SEED_EQUIPMENT } from '../db/seed'
import { todayKey } from '../lib/dates'
import { validateAge, validateHeight, validateWeight, type StatsInput } from '../lib/validate'
import type { Settings } from '../types'
import { EquipmentIcon } from './EquipmentIcon'
import { HeroArt, type HeroArtKind } from './HeroArt'
import { StatsFields } from './StatsFields'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Field, FieldError } from './ui/Field'
import { IconButton } from './ui/IconButton'
import { Segmented } from './ui/Segmented'

// The first-run intro: a few slides on what DayLoad does, then the same questions the Profile tab
// asks (units, age, height, first weight), then a way into the app. It only shows on a brand-new
// install (see useNeedsIntro) and can be skipped; the Profile tab still asks if it was.

const LAST = 5
const SOFT = { type: 'spring', duration: 0.4, bounce: 0 } as const

/** A step slides in from the side you are heading toward, and its children rise in one after another. */
const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0, transition: { ...SOFT, staggerChildren: 0.07, delayChildren: 0.05 } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -36, transition: { duration: 0.18 } }),
}
const rise: Variants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: SOFT },
  exit: {},
}
const pop: Variants = {
  enter: { opacity: 0, scale: 0.9 },
  center: { opacity: 1, scale: 1, transition: SOFT },
  exit: {},
}
const tick: Variants = {
  enter: { scale: 0 },
  center: { scale: 1, transition: { type: 'spring', duration: 0.3, bounce: 0.35, delay: 0.35 } },
  exit: {},
}

function Rise({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  )
}

/** The step heading. It takes focus when the step arrives, so screen readers announce the new screen. */
function Title({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <motion.h1 ref={ref} tabIndex={-1} variants={rise} className="font-display text-[44px] leading-none font-bold outline-none">
      {children}
    </motion.h1>
  )
}

const Lead = ({ children }: { children: ReactNode }) => (
  <Rise className="-mt-1 text-[15px] leading-relaxed text-muted">{children}</Rise>
)

/** The accent card with a big faint drawing bleeding off the corner, like Home's hero. Ink text: muted fails contrast on the accent. */
function Hero({
  label,
  title,
  art,
  artClass,
  className,
}: {
  label: string
  title: string
  art: HeroArtKind
  /** Size, position and tilt of the drawing. */
  artClass: string
  className: string
}) {
  return (
    <Rise className={`relative flex flex-col justify-between overflow-hidden rounded-hero bg-accent p-[22px] ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
        animate={{ opacity: 0.22, scale: 1, rotate: 0 }}
        transition={{ ...SOFT, duration: 0.6, delay: 0.15 }}
        className="pointer-events-none absolute inset-0"
      >
        <HeroArt kind={art} className={`absolute ${artClass}`} />
      </motion.div>
      <p className="relative text-[13px] font-semibold tracking-[0.08em] uppercase">{label}</p>
      <h1 className="relative font-display text-[52px] leading-[0.95] font-bold">{title}</h1>
    </Rise>
  )
}

const SHOWN_EQUIPMENT = ['barbell', 'dumbbells', 'cable-machine', 'lat-pulldown', 'leg-press', 'pull-up-bar']

function GymStep() {
  const items = SHOWN_EQUIPMENT.flatMap((id) => SEED_EQUIPMENT.find((e) => e.id === id) ?? [])
  return (
    <>
      <Title>Your gym, your plan</Title>
      <Lead>Tick the equipment each gym has. DayLoad only plans exercises you can do there.</Lead>
      <Rise>
        <Card compact>
          <motion.ul
            variants={{ center: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
            className="grid grid-cols-3 gap-2"
          >
            {items.map((item) => (
              <motion.li
                key={item.id}
                variants={pop}
                className="relative flex flex-col items-center gap-1.5 rounded-chip border-[1.5px] border-ink bg-surface-2 px-1.5 pt-3 pb-2.5"
              >
                <EquipmentIcon id={item.id} className="h-[42px] w-14 text-ink" />
                <span className="text-center text-[12px] leading-tight font-bold">{item.name}</span>
                <motion.span
                  variants={tick}
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-ink"
                >
                  <Check size={12} strokeWidth={3} className="text-bg" />
                </motion.span>
              </motion.li>
            ))}
          </motion.ul>
        </Card>
      </Rise>
      <Rise className="text-[15px] leading-relaxed text-muted">
        Then pick a muscle group and how long you have, and it builds the workout.
      </Rise>
    </>
  )
}

const PROGRESS_POINTS = [
  { icon: Target, title: 'A target for every exercise', text: 'It is worked out from your last session, so you know what to aim for.' },
  { icon: Trophy, title: 'Records, flagged', text: 'Beat an earlier session and it shows up on your summary.' },
  { icon: Flame, title: 'Build a streak', text: 'Train 3 or more times a week and the weeks add up.' },
]

function ProgressStep() {
  return (
    <>
      <Title>Beat last time</Title>
      <Lead>Every set you log feeds the next workout.</Lead>
      {PROGRESS_POINTS.map(({ icon: Icon, title, text }) => (
        <Rise key={title}>
          <Card compact className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-chip bg-surface-2">
              <Icon size={24} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-bold">{title}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-muted">{text}</p>
            </div>
          </Card>
        </Rise>
      ))}
    </>
  )
}

interface FormProps {
  settings: Settings
  saveUnits: (patch: Partial<Settings>) => void
  unitError: string
}

function AboutStep({
  settings,
  saveUnits,
  unitError,
  stats,
  setStats,
  errors,
}: FormProps & {
  stats: StatsInput
  setStats: (stats: StatsInput) => void
  errors: { age?: string; height?: string }
}) {
  return (
    <>
      <Title>About you</Title>
      <Lead>Used for your BMI and your profile. It stays on this phone.</Lead>
      <Rise>
        <Card className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Segmented
              legend="Weight in"
              name="intro-weightUnit"
              value={settings.weightUnit}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'lb', label: 'lb' },
              ]}
              onChange={(weightUnit) => saveUnits({ weightUnit })}
            />
            <Segmented
              legend="Height in"
              name="intro-lengthUnit"
              value={settings.lengthUnit}
              options={[
                { value: 'cm', label: 'cm' },
                { value: 'ftin', label: 'ft / in' },
              ]}
              onChange={(lengthUnit) => saveUnits({ lengthUnit })}
            />
          </div>
          {unitError && <FieldError>{unitError}</FieldError>}
          <StatsFields unit={settings.lengthUnit} value={stats} onChange={setStats} errors={errors} />
        </Card>
      </Rise>
    </>
  )
}

function WeightStep({
  unit,
  weight,
  setWeight,
  error,
}: {
  unit: string
  weight: string
  setWeight: (weight: string) => void
  error?: string
}) {
  return (
    <>
      <Title>Your weight today</Title>
      <Lead>This is where your chart starts. You can log a new weigh-in any time from the Profile tab.</Lead>
      <Rise>
        <Card>
          <Field
            label="Weight today"
            suffix={unit}
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={error}
          />
        </Card>
      </Rise>
    </>
  )
}

const STEP_LABELS = ['Get started', 'Next', 'Set up my profile', 'Next: weight', 'Save and finish']

export function Intro({ settings, onDone }: { settings: Settings; onDone: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [stats, setStats] = useState<StatsInput>({ age: '', heightA: '', heightB: '' })
  const [weight, setWeight] = useState('')
  const [errors, setErrors] = useState<{ age?: string; height?: string; weight?: string }>({})
  const [unitError, setUnitError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
  }

  async function saveUnits(patch: Partial<Settings>) {
    setUnitError('')
    try {
      await db.settings.put({ ...settings, ...patch })
    } catch {
      setUnitError('Could not save that setting. Try again.')
    }
  }

  /** Marks the intro as seen, then leaves. If that write fails the intro may show once more, which is harmless. */
  async function leave(to?: string) {
    try {
      await db.settings.put({ ...settings, introDone: true })
    } catch {
      // Nothing to tell the user: they are on their way into the app either way.
    }
    if (to) navigate(to)
    onDone()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (step < 3) return go(step + 1)

    const age = validateAge(stats.age)
    const height = validateHeight(settings.lengthUnit, stats.heightA, stats.heightB)
    if (step === 3) {
      setErrors({ age: age.error, height: height.error })
      if (age.error === undefined && height.error === undefined) go(4)
      return
    }

    if (step !== 4) return
    const w = validateWeight(settings.weightUnit, weight)
    setErrors({ weight: w.error })
    if (age.error !== undefined || height.error !== undefined || w.error !== undefined) return
    setSaving(true)
    setSaveError('')
    try {
      // Profile and first weight together, so a failure can't leave half of it saved.
      await db.transaction('rw', db.profile, db.bodyLogs, async () => {
        await db.profile.put({ id: PROFILE_ID, age: age.value, heightCm: height.value })
        await db.bodyLogs.add({ date: todayKey(), weightKg: w.value })
      })
      go(5)
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
    }
    setSaving(false)
  }

  const body = [
    <Fragment key="welcome">
      <Hero
        label="Welcome"
        title="Train with what your gym has"
        art="kettlebell"
        artClass="-right-9 top-9 w-[220px] rotate-[10deg]"
        className="h-[340px]"
      />
      <Rise className="text-[15px] leading-relaxed text-muted">
        DayLoad plans each workout from the equipment you actually have. Everything stays on this phone. Setup takes about a minute.
      </Rise>
    </Fragment>,
    <GymStep key="gym" />,
    <ProgressStep key="progress" />,
    <AboutStep key="about" settings={settings} saveUnits={saveUnits} unitError={unitError} stats={stats} setStats={setStats} errors={errors} />,
    <Fragment key="weight">
      <WeightStep unit={settings.weightUnit} weight={weight} setWeight={setWeight} error={errors.weight} />
      {saveError && <FieldError>{saveError}</FieldError>}
    </Fragment>,
    <Fragment key="done">
      <Hero
        label="Ready when you are"
        title="You're all set"
        art="dumbbell"
        artClass="-right-8 top-4 w-[230px] -rotate-[20deg]"
        className="h-[230px]"
      />
      <Rise className="text-[15px] leading-relaxed text-muted">
        Next, add the gym you train at and tick its equipment. Until then, the built-in No equipment gym plans bodyweight workouts.
      </Rise>
    </Fragment>,
  ]

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-clip px-[22px] pt-[var(--page-top)] pb-[max(20px,calc(var(--safe-bottom)+8px))]"
    >
      <div className="flex items-center gap-2">
        {/* Always in the layout so the bars do not shift; it fades in once there is a step to go back to. */}
        <motion.div animate={{ opacity: step > 0 && step < LAST ? 1 : 0 }} className="-ml-2.5">
          <IconButton label="Back" disabled={step === 0 || step === LAST || saving} onClick={() => go(step - 1)}>
            <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </motion.div>
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {Array.from({ length: LAST + 1 }, (_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                transition={SOFT}
                className="h-full origin-left rounded-full bg-ink"
              />
            </div>
          ))}
        </div>
        <motion.div animate={{ opacity: step < LAST ? 1 : 0 }} className="-mr-2.5">
          <button
            type="button"
            disabled={step === LAST || saving}
            onClick={() => void leave()}
            className="press min-h-11 px-3 text-sm font-bold text-muted disabled:pointer-events-none"
          >
            Skip
          </button>
        </motion.div>
      </div>
      <p className="sr-only" aria-live="polite">{`Step ${step + 1} of ${LAST + 1}`}</p>

      <div className="relative mt-5 flex-1">
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col gap-5"
          >
            {body[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 pt-6">
        {step < LAST ? (
          <Button type="submit" size="lg" disabled={saving}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {STEP_LABELS[step]}
              </motion.span>
            </AnimatePresence>
          </Button>
        ) : (
          <>
            <Button size="lg" onClick={() => void leave('/gyms')}>
              Add my gym
              <ArrowRight size={20} strokeWidth={2.4} aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => void leave('/')}>
              Go to Home
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
