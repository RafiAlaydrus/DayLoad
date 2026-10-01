import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Pull down from the top of a screen to refresh. iOS gives a home-screen app no pull-to-refresh of
// its own. DayLoad's data is on the phone and every screen is live, so "refresh" means: check for a
// new version of the app, then reload, which is how an update reaches the phone without closing it.

const TRIGGER = 64 // how far the circle must be pulled (px, after resistance) to count
const MAX = 96
const RESISTANCE = 0.5
const HOLD = 56 // where the circle rests while refreshing

async function refresh() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    await registration?.update()
  } catch {
    // Offline or no service worker (dev server): reloading is still a fine refresh.
  }
  window.location.reload()
}

/** `disabled` turns it off where a reload would cost something (a workout with numbers typed but not logged). */
export function PullToRefresh({ disabled }: { disabled: boolean }) {
  const pull = useMotionValue(0)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  // The circle follows the finger, fades in over the first stretch and turns as it goes.
  const y = useTransform(pull, (v) => v - 44)
  const opacity = useTransform(pull, [0, 16, TRIGGER], [0, 0.6, 1])
  const rotate = useTransform(pull, [0, MAX], [0, 270])
  const scale = useTransform(pull, [0, TRIGGER], [0.7, 1])

  useEffect(() => {
    if (disabled) return
    let startY = 0
    let startX = 0
    let tracking = false
    let dragging = false

    const atTop = () =>
      window.scrollY <= 0 && !document.querySelector('dialog[open]') && !busyRef.current

    function onStart(event: TouchEvent) {
      tracking = atTop() && event.touches.length === 1
      dragging = false
      startY = event.touches[0].clientY
      startX = event.touches[0].clientX
    }

    function onMove(event: TouchEvent) {
      if (!tracking) return
      const dy = event.touches[0].clientY - startY
      const dx = event.touches[0].clientX - startX
      // A scroll, a sideways swipe (the calendar) or a pull up is not ours.
      if (!dragging && (dy < 8 || Math.abs(dx) > dy)) {
        if (dy < 0 || Math.abs(dx) > 12) tracking = false
        return
      }
      dragging = true
      pull.set(Math.min(MAX, dy * RESISTANCE))
    }

    function onEnd() {
      if (!tracking || !dragging) return
      tracking = false
      dragging = false
      if (pull.get() >= TRIGGER) {
        busyRef.current = true
        setBusy(true)
        animate(pull, HOLD, { type: 'spring', duration: 0.3, bounce: 0 })
        // Long enough to see the spinner, so the reload does not look like a flicker.
        void Promise.all([refresh(), new Promise((resolve) => setTimeout(resolve, 700))])
      } else {
        animate(pull, 0, { type: 'spring', duration: 0.35, bounce: 0 })
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [disabled, pull])

  return (
    <div
      role="status"
      className="pointer-events-none fixed top-[var(--safe-top)] left-1/2 z-50 -translate-x-1/2"
    >
      <span className="sr-only">{busy ? 'Refreshing' : ''}</span>
      <motion.div
        style={{ y, opacity, scale }}
        className="grid size-11 place-items-center rounded-full border border-border bg-surface text-ink"
      >
        {/* While refreshing the arrow spins; while pulling it is turned by the finger. */}
        <motion.div style={busy ? undefined : { rotate }} animate={busy ? { rotate: 360 } : undefined} transition={busy ? { repeat: Infinity, ease: 'linear', duration: 0.8 } : undefined}>
          <RefreshCw size={20} strokeWidth={2.2} aria-hidden="true" />
        </motion.div>
      </motion.div>
    </div>
  )
}
