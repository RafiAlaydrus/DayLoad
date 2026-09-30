import { ChevronLeft, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { GymForm, type GymValues } from '../components/GymForm'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button, ButtonLink } from '../components/ui/Button'
import { BottomAction } from '../components/ui/BottomAction'
import { Card, SectionLabel } from '../components/ui/Card'
import { FieldError } from '../components/ui/Field'
import { IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { Option } from '../components/ui/Option'
import { Segmented } from '../components/ui/Segmented'
import { startSession } from '../db/sessions'
import { useActiveSession, useEquipment, useExercises, useGyms, useLastGymId, useTimetableToday } from '../hooks/useData'
import { listNames, namesOf } from '../lib/format'
import { MUSCLE_GROUPS, muscleLabel, PLAN_BY_TIME, recommend, TIME_OPTIONS } from '../lib/recommend'
import type { Equipment, Exercise, Gym, MuscleGroup } from '../types'

const DRAFT = '__one-time__'

export default function HitTheGym() {
  const active = useActiveSession()
  const gyms = useGyms()
  const exercises = useExercises()
  const equipment = useEquipment()
  const timetable = useTimetableToday()
  const lastGymId = useLastGymId()

  const header = (
    <div className="flex items-center gap-3">
      <IconLink to="/" label="Back to Home" outlined>
        <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
      </IconLink>
      <h1 className="font-display text-[30px] font-bold leading-none">Hit the gym</h1>
    </div>
  )

  if (
    active === undefined ||
    gyms === undefined ||
    exercises === undefined ||
    equipment === undefined ||
    timetable === undefined ||
    lastGymId === undefined
  ) {
    return (
      <>
        {header}
        <Loading className="h-[220px]" />
        <Loading className="h-[52px]" />
      </>
    )
  }

  // Two workouts at once would make "Continue workout" ambiguous, so a running one comes first.
  if (active) {
    return (
      <>
        {header}
        <Card>
          <SectionLabel>Workout in progress</SectionLabel>
          <p className="mt-2 text-[15px] leading-relaxed">
            You already have a {muscleLabel(active.muscleGroup).toLowerCase()} workout running. Finish or end it before
            starting another.
          </p>
          <ButtonLink to="/workout" className="mt-4">
            Continue workout
          </ButtonLink>
        </Card>
      </>
    )
  }

  return (
    <Planner
      header={header}
      gyms={gyms.filter((g) => !g.isTemporary)}
      exercises={exercises}
      equipment={equipment}
      timetableGroup={timetable?.muscleGroup ?? null}
      hasTimetableToday={timetable !== null}
      defaultGymId={timetable?.defaultGymId ?? lastGymId ?? undefined}
    />
  )
}

interface PlannerProps {
  header: ReactNode
  gyms: Gym[]
  exercises: Exercise[]
  equipment: Equipment[]
  timetableGroup: MuscleGroup | null
  hasTimetableToday: boolean
  defaultGymId?: string
}

function Planner({ header, gyms, exercises, equipment, timetableGroup, hasTimetableToday, defaultGymId }: PlannerProps) {
  const navigate = useNavigate()
  // Choices start as null and fall back to a default, so there is no effect syncing state from loaded data.
  const [chosenGymId, setChosenGymId] = useState<string | null>(null)
  const [draft, setDraft] = useState<GymValues | null>(null)
  const [locationSheet, setLocationSheet] = useState(false)
  const [time, setTime] = useState<number>(45)
  const [override, setOverride] = useState<MuscleGroup | null>(null)
  const [chooser, setChooser] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const savedGym = (id: string | undefined) => gyms.find((g) => g.id === id)
  const gymId =
    chosenGymId ?? (savedGym(defaultGymId) ? defaultGymId! : (gyms.find((g) => !g.isBuiltIn) ?? gyms[0])?.id)
  const usingDraft = gymId === DRAFT && draft !== null
  const equipmentIds = usingDraft ? draft.equipmentIds : (savedGym(gymId)?.equipmentIds ?? [])

  const group = override ?? timetableGroup
  const target = PLAN_BY_TIME[time]
  const picks = group ? recommend(exercises, group, equipmentIds, target.exercises) : []
  const describe = (ids: string[]) => listNames(namesOf(equipment, ids)) || 'Bodyweight only'
  const showChips = group === null || chooser || override !== null

  async function build() {
    if (!group || picks.length === 0) return
    setStarting(true)
    setError('')
    try {
      await startSession({
        gym: usingDraft ? draft : { id: gymId! },
        muscleGroup: group,
        plannedMin: time,
        exerciseIds: picks.map((e) => e.id),
        setsPerExercise: target.sets,
      })
      navigate('/workout')
    } catch {
      setError('Could not build the workout. Check that this phone has free storage, then try again.')
      setStarting(false)
    }
  }

  return (
    <>
      {header}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Where are you?</legend>
        {gyms
          .filter((g) => !g.isBuiltIn)
          .concat(gyms.filter((g) => g.isBuiltIn))
          .map((gym) => (
            <Option
              key={gym.id}
              type="radio"
              name="gym"
              checked={gymId === gym.id}
              onChange={() => setChosenGymId(gym.id)}
              title={gym.name}
              subtitle={describe(gym.equipmentIds)}
            />
          ))}
        {draft && (
          <Option
            type="radio"
            name="gym"
            checked={usingDraft}
            onChange={() => setChosenGymId(DRAFT)}
            title={draft.name || 'One-time location'}
            subtitle={describe(draft.equipmentIds)}
          />
        )}
        <button
          type="button"
          onClick={() => setLocationSheet(true)}
          className="press flex min-h-[52px] items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-border text-[15px] font-semibold text-muted"
        >
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          {draft ? 'Change one-time location' : 'New location'}
        </button>
      </fieldset>

      <Segmented
        legend="Time available"
        name="time"
        filled
        value={String(time)}
        options={TIME_OPTIONS.map((t) => ({ value: String(t), label: `${t} min` }))}
        onChange={(v) => setTime(Number(v))}
      />

      <Card>
        <SectionLabel>Plan</SectionLabel>
        {group ? (
          <>
            <p className="mt-1.5 text-[17px] font-bold">
              {muscleLabel(group)} · {picks.length} {picks.length === 1 ? 'exercise' : 'exercises'} · {time} min
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {override
                ? 'Your choice for today.'
                : 'Follows your timetable.'}
              {picks.length < target.exercises && ` Only ${picks.length} fit this gym.`}
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-[15px] leading-relaxed">
            {hasTimetableToday
              ? 'Your timetable says rest today. Pick a muscle group to train anyway.'
              : 'Your timetable has nothing for today, so pick a muscle group.'}
          </p>
        )}
        {timetableGroup && !showChips && (
          <button
            type="button"
            onClick={() => setChooser(true)}
            className="press mt-1 -ml-2 min-h-11 px-2 text-[13px] font-bold text-ink underline"
          >
            Train something else?
          </button>
        )}
        {showChips && (
          <div className="mt-3">
            <Segmented
              legend="Muscle group"
              hideLegend
              wrap
              name="group"
              value={(group ?? '') as MuscleGroup}
              options={MUSCLE_GROUPS.map((g) => ({ value: g, label: muscleLabel(g) }))}
              onChange={setOverride}
            />
          </div>
        )}
      </Card>

      {error && <FieldError>{error}</FieldError>}

      <BottomAction>
        <Button size="lg" disabled={!group || picks.length === 0 || starting || (!gymId && !usingDraft)} onClick={build}>
          Build my workout
        </Button>
      </BottomAction>

      <BottomSheet open={locationSheet} onClose={() => setLocationSheet(false)} title="New location">
        <GymForm
          initial={draft ?? undefined}
          nameRequired={false}
          submitLabel="Use this location"
          onSubmit={(values) => {
            setDraft(values)
            setChosenGymId(DRAFT)
            setLocationSheet(false)
          }}
        />
      </BottomSheet>
    </>
  )
}
