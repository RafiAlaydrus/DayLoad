import { Calendar, FileText, House, MapPin, User, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

// Icons match the mockups: house, calendar, document, map pin, person. Each one says what the tab holds.
const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/plan', label: 'Plan', icon: Calendar },
  { to: '/library', label: 'Library', icon: FileText },
  { to: '/gyms', label: 'Gyms', icon: MapPin },
  { to: '/profile', label: 'Profile', icon: User },
]

/** Fixed to the bottom of the phone column. Its bottom padding clears the iPhone home bar. */
export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-surface px-3 pt-2.5 pb-[max(12px,calc(var(--safe-bottom)-8px))]"
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `press flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
              isActive ? 'font-bold text-ink' : 'font-medium text-muted'
            }`
          }
        >
          <Icon size={22} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
