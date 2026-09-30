import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconButton } from './IconButton'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * A sheet that slides up from the bottom. Built on the native <dialog>, so showModal()
 * gives focus trapping, an inert page behind it, and Escape to close for free.
 * Content mounts only while open, so forms start fresh every time.
 */
export function BottomSheet({ open, ...sheet }: Props) {
  return <AnimatePresence>{open && <Sheet {...sheet} />}</AnimatePresence>
}

function Sheet({ onClose, title, children }: Omit<Props, 'open'>) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    // ??= so React StrictMode's second mount doesn't overwrite it with the dialog's own button.
    opener.current ??= document.activeElement
    if (dialog && !dialog.open) dialog.showModal()
    // The dialog is already out of the page when this runs, so the browser can't hand focus
    // back by itself: return it to whatever opened the sheet.
    return () => {
      if (opener.current instanceof HTMLElement) opener.current.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape: let our state close it, so the exit animation plays.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      {/* Our own scrim instead of ::backdrop, because a pseudo-element can't be animated. */}
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] w-full max-w-[430px] flex-col rounded-t-hero border border-b-0 border-border bg-surface"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
      >
        <div className="flex items-center justify-between pl-[22px] pr-2.5 pt-3">
          <h2 id={titleId} className="font-display text-[28px] font-bold leading-none">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-[22px] pb-[calc(var(--safe-bottom)+22px)] pt-3">{children}</div>
      </motion.div>
    </dialog>
  )
}
