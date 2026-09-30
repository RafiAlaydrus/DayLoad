import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useNow } from '../hooks/useNow'
import { clock } from '../lib/format'

export const REST_SECONDS = 90

/** Pinned above the bottom button after a set is logged. Counts down from a timestamp and removes itself at zero. */
export function RestTimer({ endsAt, onDone }: { endsAt: number; onDone: () => void }) {
  const now = useNow(250)
  const left = Math.ceil((endsAt - now) / 1000)
  useEffect(() => {
    if (left <= 0) onDone()
  }, [left, onDone])

  return (
    // Enters with transform and opacity only.
    <motion.div
      role="timer"
      aria-label="Rest timer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
      className="flex items-center justify-between rounded-card bg-accent py-3 pr-3 pl-[18px]"
    >
      <div>
        {/* Ink, not muted: muted text on the taupe accent fails contrast. */}
        <p className="text-xs font-semibold uppercase tracking-[0.08em]">Rest</p>
        <p className="font-display text-[44px] font-bold leading-none">{clock(left)}</p>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="press min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-bg"
      >
        Skip rest
      </button>
    </motion.div>
  )
}
