import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * The main button pinned to the bottom of the phone column (with anything stacked above it,
 * like the rest timer). It is portaled to <body> because the page slide-in transforms its
 * ancestor, and a fixed element inside a transformed ancestor is positioned against that
 * ancestor instead of the screen, so it would jump when the transition ends.
 */
export function BottomAction({ children }: { children: ReactNode }) {
  return createPortal(
    <div className="fixed bottom-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 flex-col gap-3 border-t border-border bg-bg px-[22px] pt-3 pb-[max(20px,calc(var(--safe-bottom)+8px))]">
      {children}
    </div>,
    document.body,
  )
}
