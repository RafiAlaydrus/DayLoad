import { Ban, ChevronRight, Heart } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { MuscleTiles } from '../components/MuscleTiles'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Segmented } from '../components/ui/Segmented'
import { Select } from '../components/ui/Select'
import { GUIDES } from '../content/guides'
import { useEquipment, useExercises, useSettings } from '../hooks/useData'
import { groupBy, listNames } from '../lib/format'
import { MUSCLE_GROUPS, muscleLabel } from '../lib/recommend'

const ANY = 'all'
const BODYWEIGHT = 'none'

type View = 'exercises' | 'guides'

/** The Library tab: the exercises, and the general guides. The view is in the address (?view=guides). */
export default function Library() {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'guides' ? 'guides' : 'exercises'
  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-none">Library</h1>
      <Segmented<View>
        legend="Library view"
        hideLegend
        filled
        name="libraryView"
        value={view}
        options={[
          { value: 'exercises', label: 'Exercises' },
          { value: 'guides', label: 'Guides' },
        ]}
        onChange={(v) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              if (v === 'guides') next.set('view', v)
              else next.delete('view')
              return next
            },
            { replace: true },
          )
        }
      />
      {view === 'guides' ? <GuidesList /> : <Exercises />}
    </>
  )
}

function GuidesList() {
  return (
    <Card className="py-1">
      <ul>
        {GUIDES.map((guide) => (
          <li key={guide.id} className="border-t border-border first:border-t-0">
            <Link to={`/library/guides/${guide.id}`} className="press flex min-h-[64px] items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[15px] font-bold">{guide.title}</span>
                <span className="block text-[13px] leading-snug text-muted">{guide.summary}</span>
              </span>
              <ChevronRight size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Exercises() {
  const exercises = useExercises()
  const equipment = useEquipment()
  const settings = useSettings()
  // Filters live in the address (?muscle=chest&equipment=barbell), so Back from an exercise keeps them.
  const [params, setParams] = useSearchParams()

  if (!exercises || !equipment || !settings) {
    return (
      <>
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
      <MuscleTiles name="muscle" value={muscle} onChange={(v) => setFilter('muscle', v)} />

      <Select label="Equipment" value={gear} onChange={(e) => setFilter('equipment', e.target.value)}>
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
      </Select>

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
                  <span className="flex shrink-0 items-center gap-2 text-muted">
                    {settings.favoriteIds.includes(e.id) && (
                      <>
                        <Heart size={18} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                        <span className="sr-only">Favorite</span>
                      </>
                    )}
                    {settings.avoidIds.includes(e.id) && (
                      <>
                        <Ban size={18} strokeWidth={2} aria-hidden="true" />
                        <span className="sr-only">On your avoid list</span>
                      </>
                    )}
                    <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
