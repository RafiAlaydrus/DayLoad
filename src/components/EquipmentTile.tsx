import { Check } from 'lucide-react'
import type { Equipment } from '../types'
import { EquipmentIcon } from './EquipmentIcon'

interface Props {
  item: Equipment
  checked: boolean
  onChange: () => void
}

/** One piece of equipment as a tappable tile: drawing on top, name below. A real checkbox inside, so keyboard and screen readers work. */
export function EquipmentTile({ item, checked, onChange }: Props) {
  return (
    <label className="group press relative flex cursor-pointer flex-col items-center gap-2 rounded-chip border-[1.5px] border-border bg-surface px-2 pt-4 pb-3 has-checked:border-ink has-checked:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
      <EquipmentIcon id={item.id} className="h-[54px] w-[72px] text-muted group-has-checked:text-ink" />
      <span className="text-center text-[13px] leading-tight font-bold">{item.name}</span>
      <span
        aria-hidden="true"
        className="absolute top-2 right-2 grid size-5 place-items-center rounded-full border-[1.5px] border-border group-has-checked:border-ink group-has-checked:bg-ink"
      >
        <Check size={12} strokeWidth={3} className="text-bg opacity-0 group-has-checked:opacity-100" />
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  )
}

/** The same drawing and name, small and not tappable: "this exercise needs". */
export function EquipmentBadge({ item }: { item: Equipment }) {
  return (
    <li className="flex items-center gap-2.5 rounded-chip border border-border bg-surface py-1.5 pr-3.5 pl-2">
      <EquipmentIcon id={item.id} className="h-8 w-11 shrink-0 text-ink" />
      <span className="text-[13px] leading-tight font-bold">{item.name}</span>
    </li>
  )
}
