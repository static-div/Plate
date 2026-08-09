import { useState } from 'react'
import { DateSelector } from '../date/DateSelector'

interface LogMealToDiaryProps {
  date: string
  onDateChange: (date: string) => void
  onLog: (portions: number) => void
}

export function LogMealToDiary({ date, onDateChange, onLog }: LogMealToDiaryProps) {
  const [portions, setPortions] = useState('1')

  return (
    <div className="card stack">
      <span className="field-label">Log to diary</span>
      <DateSelector date={date} onChange={onDateChange} />
      <div className="field">
        <label className="field-label" htmlFor="logPortions">
          Portions
        </label>
        <input
          id="logPortions"
          className="input"
          type="number"
          inputMode="decimal"
          value={portions}
          onChange={(e) => setPortions(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!portions || Number(portions) <= 0}
        onClick={() => onLog(Number(portions))}
      >
        Add to diary
      </button>
    </div>
  )
}
