import { useCallback, useEffect, useState } from 'react'
import { DateSelector } from '../components/date/DateSelector'
import { DiaryTotals } from '../components/dashboard/DiaryTotals'
import { QuickAddSheet } from '../components/dashboard/QuickAddSheet'
import { TdeeSummary } from '../components/dashboard/TdeeSummary'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { useSelectedDate } from '../hooks/useSelectedDate'
import type { DiaryEntryRow, FoodRow } from '../services/db/types'
import { createDiaryEntry, listDiaryEntriesByDate } from '../services/diaryEntry'
import { listFoods } from '../services/food'
import { getActiveTdee, type ActiveTdee } from '../services/tdee'

export function DashboardPage() {
  const userId = useCurrentUserId()
  const [selectedDate, setSelectedDate] = useSelectedDate()
  const [entries, setEntries] = useState<DiaryEntryRow[]>([])
  const [tdee, setTdee] = useState<ActiveTdee | null>(null)
  const [foods, setFoods] = useState<FoodRow[]>([])
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const refresh = useCallback(async () => {
    const [dayEntries, activeTdee, catalog] = await Promise.all([
      listDiaryEntriesByDate(userId, selectedDate),
      getActiveTdee(userId),
      listFoods(userId),
    ])
    setEntries(dayEntries)
    setTdee(activeTdee)
    setFoods(catalog)
  }, [userId, selectedDate])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleQuickAdd(food: FoodRow, quantity: number) {
    await createDiaryEntry(userId, {
      date: selectedDate,
      source_type: 'food',
      source_id: food.id,
      quantity,
      quantity_unit: food.serving_unit,
    })
    setShowQuickAdd(false)
    await refresh()
  }

  return (
    <div className="page">
      <DateSelector date={selectedDate} onChange={setSelectedDate} />
      <TdeeSummary tdee={tdee} />
      <DiaryTotals entries={entries} activeTdee={tdee?.activeTdee ?? null} />
      <div className="stack">
        <span className="field-label">Logged this day</span>
        {entries.length === 0 ? (
          <p className="text-muted">Nothing logged yet.</p>
        ) : (
          <div className="list">
            {entries.map((entry) => (
              <div key={entry.id} className="list-row">
                <span>{entry.s_name}</span>
                <span className="text-sm text-muted">{Math.round(entry.s_calories)} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="fab" aria-label="Quick add" onClick={() => setShowQuickAdd(true)}>
        +
      </button>
      {showQuickAdd && (
        <QuickAddSheet foods={foods} onConfirm={handleQuickAdd} onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  )
}
