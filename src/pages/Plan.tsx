import { useSearchParams } from 'react-router-dom'
import { PlanCalendar } from '../components/PlanCalendar'
import { Timetable } from '../components/Timetable'
import { Segmented } from '../components/ui/Segmented'

type View = 'calendar' | 'timetable'

/** The Plan tab: the month calendar, and the weekly timetable that drives it. */
export default function Plan() {
  // The view lives in the address (?view=timetable), so Back from Settings or a summary returns to the same one.
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'timetable' ? 'timetable' : 'calendar'

  return (
    <>
      <h1 className="font-display text-[34px] font-bold leading-none">Plan</h1>
      <Segmented<View>
        legend="Plan view"
        hideLegend
        filled
        name="planView"
        value={view}
        options={[
          { value: 'calendar', label: 'Calendar' },
          { value: 'timetable', label: 'Timetable' },
        ]}
        onChange={(v) => setParams(v === 'calendar' ? {} : { view: v }, { replace: true })}
      />
      {view === 'calendar' ? <PlanCalendar /> : <Timetable />}
    </>
  )
}
