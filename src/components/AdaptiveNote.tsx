import { Link } from 'react-router-dom'
import { Card } from './ui/Card'

/** Shown on the Plan tab in Adaptive mode, where Hit the gym picks the muscle group itself and the timetable is not used. */
export function AdaptiveNote({ what }: { what: string }) {
  return (
    <Card compact className="flex items-center justify-between gap-3">
      <p className="text-[13px] leading-snug">Adaptive mode is on, so Hit the gym does not use {what}.</p>
      <Link
        to="/profile/settings"
        className="press inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-surface-2 px-4 text-[13px] font-bold"
      >
        Settings
      </Link>
    </Card>
  )
}
