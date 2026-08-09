import { todayLocal } from '../../app/todayLocal'

export interface DateSelectorProps {
  date: string // 'YYYY-MM-DD'
  onChange: (date: string) => void
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(year, month - 1, day)
  shifted.setDate(shifted.getDate() + days)
  const y = shifted.getFullYear()
  const m = String(shifted.getMonth() + 1).padStart(2, '0')
  const d = String(shifted.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DateSelector({ date, onChange }: DateSelectorProps) {
  const isToday = date === todayLocal()

  return (
    <div className="stack">
      <div className="row-between">
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          onClick={() => onChange(shiftDate(date, -1))}
          aria-label="Previous day"
        >
          ‹
        </button>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          onClick={() => onChange(shiftDate(date, 1))}
          aria-label="Next day"
        >
          ›
        </button>
      </div>
      {!isToday && (
        <button type="button" className="btn btn-secondary" onClick={() => onChange(todayLocal())}>
          Today
        </button>
      )}
    </div>
  )
}
