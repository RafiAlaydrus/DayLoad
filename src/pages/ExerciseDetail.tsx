import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EquipmentBadge } from '../components/EquipmentTile'
import { HowTo } from '../components/HowTo'
import { ButtonLink } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { IconLink } from '../components/ui/IconButton'
import { Loading } from '../components/ui/Loading'
import { useEquipment, useExercises } from '../hooks/useData'
import { muscleLabel } from '../lib/recommend'

export default function ExerciseDetail() {
  const { id } = useParams()
  const exercises = useExercises()
  const equipment = useEquipment()

  const back = (
    <IconLink to="/library" label="Back to Library" outlined className="-ml-0.5">
      <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
    </IconLink>
  )

  if (!exercises || !equipment) {
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
