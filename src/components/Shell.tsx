import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { db } from '../db/db'
import { ErrorBoundary } from './ErrorBoundary'
import { TabBar } from './TabBar'

/**
 * Opens the database and, if the browser refuses (blocked or full storage), throws so the
 * ErrorBoundary shows its error card. Without this, live queries stay on "Loading" forever:
 * Dexie's liveQuery deliberately swallows the "database closed" error that a failed open causes.
 * "Try again" remounts this guard, which retries the open.
 */
function DbGuard() {
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    db.open().catch(setError)
  }, [])
  if (error) throw error
  return null
}

/**
 * The phone column: max 430px wide and centered (on a laptop it is simply a phone-shaped
 * column), pages inside it, tab bar pinned below. Only pages transition, never the tab bar.
 */
export function Shell() {
  const { pathname } = useLocation()

  // A new screen starts at the top, like a native push.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    // overflow-x-clip: the 16px slide-in must never create a horizontal scrollbar.
    <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip">
      <motion.main
        key={pathname}
        // Slide + fade, transform and opacity only. MotionConfig (App.tsx) drops the slide for reduced motion.
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
        className="flex flex-col gap-[18px] px-[22px] pt-[var(--page-top)] pb-[calc(var(--tabbar-h)+24px)]"
      >
        {/* Keyed by route so leaving a crashed screen clears the error. */}
        <ErrorBoundary key={pathname}>
          <DbGuard />
          <Outlet />
        </ErrorBoundary>
      </motion.main>
      <TabBar />
    </div>
  )
}
