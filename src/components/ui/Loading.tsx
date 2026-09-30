/** Card-shaped placeholder shown while a database read is in flight. Invisible for the first 250ms (see .loading-delay), so quick reads never flash. */
export function Loading({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      className={`loading-delay rounded-card border border-border bg-surface ${className}`}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}
