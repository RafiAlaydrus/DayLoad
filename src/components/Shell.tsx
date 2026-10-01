import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { db } from '../db/db'
import { useNeedsIntro, useSettings } from '../hooks/useData'
import { ErrorBoundary } from './ErrorBoundary'
import { Intro } from './Intro'
import { PullToRefresh } from './PullToRefresh'
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
  const needsIntro = useNeedsIntro()
  const settings = useSettings()
  // The intro saves a profile part way through, which makes needsIntro false while it is still on screen.
  // So once it starts it stays until it says it is done, and "done" is final.
  const [intro, setIntro] = useState<'waiting' | 'on' | 'done'>('waiting')
  if (intro === 'waiting' && needsIntro) setIntro('on')
  // Hit the gym, Workout and the summary are focused screens (see the mockups): no tab bar, a pinned button instead.
  const focused = pathname === '/hit-the-gym' || pathname === '/workout' || pathname === '/cardio' || pathname.startsWith('/summary')

  // A new screen starts at the top, like a native push.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Nothing to show yet (a few milliseconds on launch). DbGuard still runs, so a database that cannot open shows its error.
  if (needsIntro === undefined || !settings) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-[430px] px-[22px] pt-[var(--page-top)]">
        <ErrorBoundary>
          <DbGuard />
        </ErrorBoundary>
      </div>
    )
  }
  if (intro === 'on') return <Intro settings={settings} onDone={() => setIntro('done')} />

  return (
    // overflow-x-clip: the 16px slide-in must never create a horizontal scrollbar.
    <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip">
      <motion.main
        key={pathname}
        // Slide + fade, transform and opacity only. MotionConfig (App.tsx) drops the slide for reduced motion.
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
        className={`flex flex-col gap-[18px] px-[22px] pt-[var(--page-top)] ${
          // Room for the pinned bar. The workout's is taller because the rest timer stacks above its button.
          !focused
            ? 'pb-[calc(var(--tabbar-h)+24px)]'
            : pathname === '/workout'
              ? 'pb-[calc(var(--safe-bottom)+240px)]'
              : 'pb-[calc(var(--safe-bottom)+130px)]'
        }`}
      >
        {/* Keyed by route so leaving a crashed screen clears the error. */}
        <ErrorBoundary key={pathname}>
          <DbGuard />
          <Outlet />
        </ErrorBoundary>
      </motion.main>
      {!focused && <TabBar />}
      {/* Not on the workout or cardio screens: a reload there would throw away numbers typed but not yet saved. */}
      <PullToRefresh disabled={pathname === '/workout' || pathname === '/cardio'} />
    </div>
  )
}
