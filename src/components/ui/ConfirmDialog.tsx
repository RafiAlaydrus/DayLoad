import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** "Are you sure?" for anything that deletes or replaces data. Cancel is on the left, the action on the right. */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title}>
      <p className="text-[15px] leading-relaxed text-muted">{message}</p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  )
}
