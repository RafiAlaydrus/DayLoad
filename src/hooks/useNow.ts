import { useEffect, useState } from 'react'

/** The current time, refreshed every `intervalMs`. Clocks are computed from timestamps, so a paused or throttled tab never drifts. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
