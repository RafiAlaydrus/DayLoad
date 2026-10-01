import { Footprints } from 'lucide-react'
import { useActiveCardio, useFinishedCardio, useSettings, useTimetableToday } from '../hooks/useData'
import { cardioLabel, cardioText, goalText } from '../lib/cardio'
import { todayKey } from '../lib/dates'
import { ButtonLink } from './ui/Button'
import { Card, SectionLabel } from './ui/Card'

/**
 * Home's cardio card: a session in progress, today's planned cardio from the timetable, or what you did today.
 * It is not there on days with nothing to say (start unplanned cardio from Hit the gym).
 */
export function CardioCard() {
  const active = useActiveCardio()
  const finished = useFinishedCardio()
  const today = useTimetableToday()
  const settings = useSettings()
  if (active === undefined || !finished || today === undefined || !settings) return null

  // Only Timetable mode follows the timetable (Adaptive mode picks muscles, not cardio).
  const planned = settings.workoutMode === 'timetable' ? today?.cardio : undefined
  const doneToday = finished.filter((c) => c.date === todayKey())

  let title: string
  let detail: string | null = null
  let action: string | null = null
  let label = 'Cardio'
  if (active) {
    label = 'Cardio in progress'
    title = cardioLabel(active.kind)
    detail = active.goal ? `Goal ${goalText(active.goal)}` : null
    action = 'Continue'
  } else if (planned && doneToday.length === 0) {
    label = 'Cardio today'
    title = cardioText(planned)
    action = 'Start'
  } else if (doneToday.length > 0) {
    label = 'Cardio done'
    const last = doneToday[doneToday.length - 1]
    title = `${cardioLabel(last.kind)}, ${last.minutes} min`
    detail = last.steps ? `${last.steps.toLocaleString('en-US')} steps` : null
  } else {
    return null
  }

  return (
    <Card compact className="flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-chip bg-surface-2">
        <Footprints size={24} strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <SectionLabel>{label}</SectionLabel>
        <p className="mt-0.5 truncate text-base font-bold">{title}</p>
        {detail && <p className="text-[13px] text-muted">{detail}</p>}
      </div>
      {action && (
        <ButtonLink to="/cardio" size="sm">
          {action}
        </ButtonLink>
      )}
    </Card>
  )
}
