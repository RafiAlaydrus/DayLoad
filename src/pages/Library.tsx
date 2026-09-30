import { ChevronDown, ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Segmented } from '../components/ui/Segmented'
import { useEquipment, useExercises } from '../hooks/useData'
import { groupBy, listNames } from '../lib/format'
import { MUSCLE_GROUPS, muscleLabel } from '../lib/recommend'
import type { MuscleGroup } from '../types'

const ANY = 'all'
const BODYWEIGHT = 'none'

export default function Library() {
  const exercises = useExercises()
  const equipment = useEquipment()
  // Filters live in the address (?muscle=chest&equipment=barbell), so Back from an exercise keeps them.
  const [params, setParams] = useSearchParams()
  const selectId = useId()

  const title = <h1 className="font-display text-[34px] font-bold leading-none">Library</h1>
  if (!exercises || !equipment) {
    return (
      <>
        {title}
        <Loading className="h-12" />
        <Loading className="h-[300px]" />
      </>
    )
  }

  const muscleParam = params.get('muscle')
  const gearParam = params.get('equipment')
  const muscle = MUSCLE_GROUPS.find((g) => g === muscleParam) ?? ANY
  const gear = gearParam === BODYWEIGHT || equipment.some((e) => e.id === gearParam) ? gearParam! : ANY

  const setFilter = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === ANY) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )

  const name = new Map(equipment.map((e) => [e.id, e.name]))
  const shown = exercises.filter(
    (e) =>
      (muscle === ANY || e.muscleGroup === muscle) &&
      (gear === ANY || (gear === BODYWEIGHT ? e.equipmentIds.length === 0 : e.equipmentIds.includes(gear))),
  )

  return (
    <>
      {title}

      <Segmented
        legend="Muscle group"
        hideLegend
        wrap
        name="muscle"
        value={muscle as MuscleGroup | typeof ANY}
        options={[{ value: ANY, label: 'All' }, ...MUSCLE_GROUPS.map((g) => ({ value: g, label: muscleLabel(g) }))]}
        onChange={(v) => setFilter('muscle', v)}
      />

      <div>
        <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-semibold text-muted">
          Equipment
        </label>
        <div className="relative">
          <select
            id={selectId}
            value={gear}
            onChange={(e) => setFilter('equipment', e.target.value)}
            className="min-h-12 w-full appearance-none rounded-chip border border-border bg-surface pr-11 pl-4 text-base font-semibold text-ink"
          >
            <option value={ANY}>Any equipment</option>
            <option value={BODYWEIGHT}>Bodyweight only</option>
            {groupBy(equipment).map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={20} strokeWidth={2} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <p className="text-[13px] text-muted" aria-live="polite">
        {shown.length} {shown.length === 1 ? 'exercise' : 'exercises'}
      </p>

      {shown.length === 0 ? (
        <Card>
          <p className="text-[15px] font-semibold">No exercises match</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">Try another muscle group or a different piece of equipment.</p>
        </Card>
      ) : (
        <Card className="py-1">
          <ul>
            {shown.map((e) => (
              <li key={e.id} className="border-t border-border first:border-t-0">
                <Link to={`/library/${e.id}`} className="press flex min-h-[64px] items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold">{e.name}</span>
                    <span className="block text-[13px] leading-snug text-muted">
                      {muscleLabel(e.muscleGroup)} · {listNames(e.equipmentIds.map((id) => name.get(id) ?? id)) || 'Bodyweight'}
                    </span>
                  </span>
                  <ChevronRight size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
