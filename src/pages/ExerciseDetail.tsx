import { Ban, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EquipmentBadge } from '../components/EquipmentTile'
import { HowTo } from '../components/HowTo'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { FieldError } from '../components/ui/Field'
import { IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { toggleExercisePref } from '../db/prefs'
import { useEquipment, useExercises, useSettings } from '../hooks/useData'
import { muscleLabel, type Pref } from '../lib/recommend'
import type { Settings } from '../types'

/** Favorite or avoid this exercise. Each is a toggle, and choosing one clears the other. */
function PrefButtons({ id, settings }: { id: string; settings: Settings }) {
  const [error, setError] = useState('')
  const favorite = settings.favoriteIds.includes(id)
  const avoided = settings.avoidIds.includes(id)

  async function toggle(pref: Pref) {
    setError('')
    try {
      await toggleExercisePref(id, pref)
    } catch {
      setError('Could not save that. Try again.')
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {/* Heart for favorite and a crossed circle for avoid: the two marks the Library rows show too. */}
        <Button variant={favorite ? 'primary' : 'secondary'} aria-pressed={favorite} onClick={() => toggle('favorite')}>
          <Heart size={18} strokeWidth={2.4} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
          Favorite
        </Button>
        <Button variant={avoided ? 'primary' : 'secondary'} aria-pressed={avoided} onClick={() => toggle('avoid')}>
          <Ban size={18} strokeWidth={2.4} aria-hidden="true" />
          Avoid
        </Button>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted" aria-live="polite">
        {favorite
          ? 'A favorite: picked first when a workout is built.'
          : avoided
            ? 'On your avoid list: never suggested, and not offered as a swap.'
            : 'Favorite it to have it picked first, or avoid it to keep it out of your workouts.'}
      </p>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

export default function ExerciseDetail() {
  const { id } = useParams()
  const exercises = useExercises()
  const equipment = useEquipment()
  const settings = useSettings()

  const back = (
    <IconLink to="/library" label="Back to Library" outlined className="-ml-0.5">
      <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
    </IconLink>
  )

  if (!exercises || !equipment || !settings) {
    return (
      <>
        {back}
        <Loading className="h-[60px]" />
        <Loading className="h-[320px]" />
      </>
    )
  }

  const exercise = exercises.find((e) => e.id === id)
  if (!exercise) {
    return (
      <>
        {back}
        <h1 className="font-display text-[34px] font-bold leading-none">Exercise not found</h1>
        <Card>
          <p className="text-[15px] leading-relaxed">There is no exercise with that address in the library.</p>
          <ButtonLink to="/library" className="mt-4">
            Back to Library
          </ButtonLink>
        </Card>
      </>
    )
  }

  const needs = equipment.filter((e) => exercise.equipmentIds.includes(e.id))
  const alternatives = exercise.alternativeIds
    .map((aid) => exercises.find((e) => e.id === aid))
    .filter((e) => e !== undefined)

  return (
    <>
      {back}
      <div>
        <p className="text-[13px] font-semibold text-muted">{muscleLabel(exercise.muscleGroup)}</p>
        <h1 className="mt-1 font-display text-[44px] font-bold leading-[0.95]">{exercise.name}</h1>
      </div>

      <PrefButtons id={exercise.id} settings={settings} />

      <Card>
        <SectionLabel>Equipment</SectionLabel>
        {needs.length === 0 ? (
          <p className="mt-1.5 text-[15px] font-semibold">Bodyweight, no equipment needed</p>
        ) : (
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {needs.map((item) => (
              <EquipmentBadge key={item.id} item={item} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <HowTo exercise={exercise} />
      </Card>

      {alternatives.length > 0 && (
        <Card className="py-3">
          <SectionLabel>Alternatives</SectionLabel>
          <ul className="mt-1">
            {alternatives.map((alt) => (
              <li key={alt.id} className="border-t border-border first:border-t-0">
                <Link to={`/library/${alt.id}`} className="press flex min-h-12 items-center justify-between gap-3 py-2">
                  <span className="text-[15px] font-semibold">{alt.name}</span>
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
