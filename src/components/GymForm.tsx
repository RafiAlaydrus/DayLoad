import { useState, type FormEvent } from 'react'
import { useEquipment } from '../hooks/useData'
import { groupBy } from '../lib/format'
import { EquipmentTile } from './EquipmentTile'
import { Button } from './ui/Button'
import { Field, FieldError } from './ui/Field'
import { Loading } from './ui/Loading'

export interface GymValues {
  name: string
  equipmentIds: string[]
}

interface Props {
  initial?: GymValues
  /** A saved gym needs a name. A one-time location may leave it blank. */
  nameRequired: boolean
  submitLabel: string
  onSubmit: (values: GymValues) => Promise<void> | void
  /** Shown as a second button when editing a saved gym. */
  onDelete?: () => void
}

/** Name plus an equipment checklist. Lives inside a BottomSheet, so it mounts fresh every time it opens. */
export function GymForm({ initial, nameRequired, submitLabel, onSubmit, onDelete }: Props) {
  const equipment = useEquipment()
  const [name, setName] = useState(initial?.name ?? '')
  const [selected, setSelected] = useState<string[]>(initial?.equipmentIds ?? [])
  const [nameError, setNameError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (nameRequired && name.trim() === '') {
      setNameError('Give this gym a name.')
      // The equipment list is long, so the button can be far from the field. Focusing scrolls the error into view.
      ;(event.currentTarget.elements.namedItem('name') as HTMLInputElement | null)?.focus()
      return
    }
    setNameError('')
    setSaving(true)
    setSaveError('')
    try {
      await onSubmit({ name: name.trim(), equipmentIds: selected })
    } catch {
      setSaveError('Could not save. Check that this phone has free storage, then try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field
        name="name"
        label={nameRequired ? 'Name' : 'Name (optional)'}
        autoComplete="off"
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
      />
      <fieldset>
        <legend className="mb-2 flex w-full items-baseline justify-between text-[13px] font-semibold text-muted">
          <span>Equipment</span>
          <span>{selected.length === 0 ? 'None selected: bodyweight only' : `${selected.length} selected`}</span>
        </legend>
        {equipment ? (
          <div className="flex flex-col gap-5">
            {groupBy(equipment).map(({ group, items }) => (
              <fieldset key={group}>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{group}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => (
                    <EquipmentTile key={item.id} item={item} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        ) : (
          <Loading className="h-40" />
        )}
      </fieldset>
      {saveError && <FieldError>{saveError}</FieldError>}
      <Button type="submit" disabled={saving}>
        {submitLabel}
      </Button>
      {onDelete && (
        <Button variant="secondary" onClick={onDelete} disabled={saving}>
          Delete gym
        </Button>
      )}
    </form>
  )
}
