import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { db } from '../db/db'
import { useGyms, useSettings, useTimetable } from '../hooks/useData'
import { WEEK_ORDER } from '../lib/calendar'
import { parseDateKey, todayKey, weekdayName } from '../lib/dates'
import { cardioText, defaultCardioDraft, isRestDay, type CardioDraft } from '../lib/cardio'
import { validateCardioGoal } from '../lib/validate'
import { groupsLabel, groupsOf, MUSCLE_GROUPS } from '../lib/recommend'
import type { Gym, TimetableDay } from '../types'
import { AdaptiveNote } from './AdaptiveNote'
import { CardioPicker } from './CardioPicker'
import { MuscleTiles, type Choice } from './MuscleTiles'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { FieldError } from './ui/Field'
import { Loading } from './ui/Loading'
import { Select } from './ui/Select'

/** The weekly timetable: one row per weekday, Monday first. Tap a day to set a muscle group (or rest) and a default gym. */
export function Timetable() {
  const rows = useTimetable()
  const gyms = useGyms()
  const settings = useSettings()
  const [editing, setEditing] = useState<number | null>(null)

  if (!rows || !gyms || !settings) {
    return (
      <>
        <Loading className="h-[60px]" />
        <Loading className="h-[400px]" />
      </>
    )
  }

  const today = parseDateKey(todayKey()).getDay()
  const saved = gyms.filter((g) => !g.isTemporary)
  const row = (day: number) => rows.find((r) => r.dayOfWeek === day)
  const gymName = (id?: string) => saved.find((g) => g.id === id)?.name

  return (
    <>
      {settings.workoutMode === 'adaptive' && <AdaptiveNote what="this timetable" />}

      <Card className="py-1">
        <ul>
          {WEEK_ORDER.map((day) => {
            const entry = row(day)
            const groups = entry ? groupsOf(entry) : []
            const gym = groups.length > 0 ? gymName(entry?.defaultGymId) : undefined
            const parts = entry ? [groups.length > 0 ? groupsLabel(groups) : '', entry.cardio ? cardioText(entry.cardio) : ''].filter(Boolean) : []
            return (
              <li key={day} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => setEditing(day)}
                  className="press flex min-h-[60px] w-full items-center justify-between gap-3 py-2.5 text-left"
                >
                  <span className="text-base font-bold">
                    {weekdayName(day)}
                    {day === today && <span className="ml-2 text-xs font-semibold text-muted">Today</span>}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 text-right">
                      <span className={`block text-[15px] font-semibold ${entry ? '' : 'text-muted'}`}>
                        {!entry ? 'Not set' : isRestDay(entry) ? 'Rest' : parts.join(' + ')}
                      </span>
                      {gym && <span className="block truncate text-[13px] text-muted">{gym}</span>}
                    </span>
                    <ChevronRight size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <p className="text-[13px] leading-relaxed text-muted">
        In Timetable mode, Hit the gym starts from today's row. A day you leave as Not set means you choose that day.
      </p>

      <BottomSheet open={editing !== null} onClose={() => setEditing(null)} title={editing === null ? '' : weekdayName(editing)}>
        {editing !== null && <DayForm day={editing} existing={row(editing)} gyms={saved} onDone={() => setEditing(null)} />}
      </BottomSheet>
    </>
  )
}

function DayForm({ day, existing, gyms, onDone }: { day: number; existing?: TimetableDay; gyms: Gym[]; onDone: () => void }) {
  // Several muscle groups can share a day, or the day is Rest. Rest and the groups exclude each other.
  const [picked, setPicked] = useState<Choice[]>(
    existing ? (isRestDay(existing) ? ['rest'] : [...groupsOf(existing), ...(existing.cardio ? (['cardio'] as const) : [])]) : [],
  )
  const [cardio, setCardio] = useState<CardioDraft>(
    existing?.cardio ? { kind: existing.cardio.kind, type: existing.cardio.goal.type, text: String(existing.cardio.goal.value) } : defaultCardioDraft(),
  )
  const [cardioError, setCardioError] = useState('')
  const lifting = picked.some((c) => c !== 'rest' && c !== 'cardio')

  function toggle(option: Choice) {
    setPicked((now) =>
      option === 'rest'
        ? now.includes('rest')
          ? []
          : ['rest']
        : now.includes(option)
          ? now.filter((c) => c !== option)
          : [...now.filter((c) => c !== 'rest'), option],
    )
  }
  // A gym that was deleted since is not in the list, so the select falls back to "No default gym".
  const [gymId, setGymId] = useState(gyms.some((g) => g.id === existing?.defaultGymId) ? (existing?.defaultGymId ?? '') : '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (picked.length === 0) {
      setError('Pick at least one muscle group, or Rest.')
      return
    }
    // Cardio needs a goal (how long, or how many steps), so a day always says what to do.
    const goal = picked.includes('cardio') ? validateCardioGoal(cardio.kind, cardio.type, cardio.text) : null
    setCardioError(goal?.error ?? '')
    if (goal?.error !== undefined) return
    setBusy(true)
    setError('')
    try {
      // In the same order as everywhere else, whatever order they were tapped in.
      const groups = MUSCLE_GROUPS.filter((g) => picked.includes(g))
      await db.timetable.put({
        dayOfWeek: day,
        muscleGroup: groups[0] ?? null,
        ...(groups.length > 0 ? { muscleGroups: groups } : {}),
        ...(goal ? { cardio: { kind: cardio.kind, goal: { type: cardio.type, value: goal.value! } } } : {}),
        ...(groups.length > 0 && gymId ? { defaultGymId: gymId } : {}),
      })
      onDone()
    } catch {
      setError('Could not save. Check that this phone has free storage, then try again.')
      setBusy(false)
    }
  }

  async function clear() {
    setBusy(true)
    setError('')
    try {
      await db.timetable.delete(day)
      onDone()
    } catch {
      setError('Could not clear that day. Try again.')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <MuscleTiles name="day" first="rest" cardio value={picked} onChange={toggle} />
      <p className="-mt-1 text-[13px] leading-relaxed text-muted">Tap more than one to combine them, and add Cardio to any day.</p>
      {picked.includes('cardio') && <CardioPicker name="day-cardio" value={cardio} onChange={setCardio} error={cardioError} />}
      {lifting && (
        <Select label="Default gym" value={gymId} onChange={(e) => setGymId(e.target.value)}>
          <option value="">No default gym</option>
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      )}
      {error && <FieldError>{error}</FieldError>}
      <Button onClick={save} disabled={busy}>
        Save {weekdayName(day)}
      </Button>
      {existing && (
        <Button variant="secondary" onClick={clear} disabled={busy}>
          Clear this day
        </Button>
      )}
    </div>
  )
}
