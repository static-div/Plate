import { useCallback, useEffect, useState } from 'react'
import { DateSelector } from '../components/date/DateSelector'
import { AddToDiarySheet } from '../components/dashboard/AddToDiarySheet'
import { DiaryTotals } from '../components/dashboard/DiaryTotals'
import { TdeeSummary } from '../components/dashboard/TdeeSummary'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { useSelectedDate } from '../hooks/useSelectedDate'
import { errorMessage } from '../lib/errorMessage'
import type { DiaryEntryRow, FoodRow, MealRow } from '../services/db/types'
import { createDiaryEntry, listDiaryEntriesByDate } from '../services/diaryEntry'
import { listFoods } from '../services/food'
import { listMeals } from '../services/meal'
import { getActiveTdee, type ActiveTdee } from '../services/tdee'

export function DashboardPage() {
  const userId = useCurrentUserId()
  const [selectedDate, setSelectedDate] = useSelectedDate()
  const [entries, setEntries] = useState<DiaryEntryRow[]>([])
  const [tdee, setTdee] = useState<ActiveTdee | null>(null)
  const [foods, setFoods] = useState<FoodRow[]>([])
  const [meals, setMeals] = useState<MealRow[]>([])
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const [dayEntries, activeTdee, foodCatalog, mealCatalog] = await Promise.all([
        listDiaryEntriesByDate(userId, selectedDate),
        getActiveTdee(userId),
        listFoods(userId),
        listMeals(userId),
      ])
      setEntries(dayEntries)
      setTdee(activeTdee)
      setFoods(foodCatalog)
      setMeals(mealCatalog)
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [userId, selectedDate])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleQuickAddFood(food: FoodRow, quantity: number) {
    try {
      setError(null)
      await createDiaryEntry(userId, {
        date: selectedDate,
        source_type: 'food',
        source_id: food.id,
        quantity,
        quantity_unit: food.serving_unit,
      })
      setShowQuickAdd(false)
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleQuickAddMeal(meal: MealRow, portions: number) {
    try {
      setError(null)
      await createDiaryEntry(userId, {
        date: selectedDate,
        source_type: 'meal',
        source_id: meal.id,
        quantity: portions,
        quantity_unit: 'portion',
      })
      setShowQuickAdd(false)
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="page">
      <DateSelector date={selectedDate} onChange={setSelectedDate} />
      <TdeeSummary tdee={tdee} />
      <DiaryTotals entries={entries} activeTdee={tdee?.activeTdee ?? null} />
      {error && <p className="field-error">{error}</p>}
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
        <AddToDiarySheet
          foods={foods}
          meals={meals}
          onConfirmFood={handleQuickAddFood}
          onConfirmMeal={handleQuickAddMeal}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  )
}
