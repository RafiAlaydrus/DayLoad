import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { GymForm } from '../components/GymForm'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { Card, SectionLabel } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Loading } from '../components/ui/Loading'
import { db } from '../db/db'
import { useEquipment, useGyms } from '../hooks/useData'
import { listNames, namesOf } from '../lib/format'
import type { Gym } from '../types'

export default function Gyms() {
  const gyms = useGyms()
  const equipment = useEquipment()
  const [editing, setEditing] = useState<Gym | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Gym | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="font-display text-[34px] font-bold leading-none">Gyms</h1>
      <Button size="sm" onClick={() => setEditing('new')}>
        <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
        Add gym
      </Button>
    </div>
  )

  if (!gyms || !equipment) {
    return (
      <>
        {header}
        <Loading className="h-[84px]" />
        <Loading className="h-[84px]" />
      </>
    )
  }

  const summary = (gym: Gym) => listNames(namesOf(equipment, gym.equipmentIds)) || 'Bodyweight only'
  const saved = gyms.filter((g) => !g.isTemporary)
  const mine = saved.filter((g) => !g.isBuiltIn)
  const builtIn = saved.filter((g) => g.isBuiltIn)

  async function save(values: { name: string; equipmentIds: string[] }) {
    if (editing === 'new') {
      await db.gyms.add({ id: crypto.randomUUID(), ...values, isTemporary: false, isBuiltIn: false })
    } else if (editing) {
      await db.gyms.update(editing.id, values)
    }
    setEditing(null)
  }

  async function remove() {
    const gym = deleting
    setDeleting(null)
    if (!gym) return
    setDeleteError('')
    try {
      // A timetable day that named this gym as its default must not point at nothing.
      await db.transaction('rw', db.gyms, db.timetable, async () => {
        await db.gyms.delete(gym.id)
        // At most seven rows and no index on the gym, so filter them here.
        await db.timetable
          .filter((row) => row.defaultGymId === gym.id)
          .modify((row) => {
            delete row.defaultGymId
          })
      })
      setEditing(null)
    } catch {
      setDeleteError('Could not delete that gym. Try again.')
    }
  }

  return (
    <>
      {header}

      {mine.length === 0 && (
        <Card>
          <SectionLabel>Your gyms</SectionLabel>
          <p className="mt-2 text-[15px] leading-relaxed">
            No gyms yet. Add the places you train and tick the equipment each one has, so DayLoad only plans exercises you can do there.
          </p>
        </Card>
      )}

      {mine.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {mine.map((gym) => (
            <li key={gym.id}>
              <button
                type="button"
                onClick={() => setEditing(gym)}
                className="press flex w-full items-center justify-between gap-3 rounded-card border border-border bg-surface p-[18px] text-left"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-base font-bold">{gym.name}</span>
                  <span className="text-[13px] leading-snug text-muted">{summary(gym)}</span>
                </span>
                <ChevronRight size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {builtIn.map((gym) => (
        <Card key={gym.id}>
          <p className="text-base font-bold">{gym.name}</p>
          <p className="mt-1 text-[13px] text-muted">Built in. Bodyweight exercises only, so it always works.</p>
        </Card>
      ))}

      {deleteError && <p role="alert" className="text-[13px] font-medium">{deleteError}</p>}

      <BottomSheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New gym' : 'Edit gym'}>
        {editing && (
          <GymForm
            initial={editing === 'new' ? undefined : { name: editing.name, equipmentIds: editing.equipmentIds }}
            nameRequired
            submitLabel={editing === 'new' ? 'Save gym' : 'Save changes'}
            onSubmit={save}
            onDelete={editing === 'new' ? undefined : () => setDeleting(editing)}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'gym'}?`}
        message="Workouts you already did there keep their record. This cannot be undone."
        confirmLabel="Delete gym"
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
