import { useMemo, useState } from 'react'
import { SearchBar } from '../common/SearchBar'
import type { MealRow } from '../../services/db/types'

interface MealPickerProps {
  meals: MealRow[]
  onSelect: (meal: MealRow) => void
}

export function MealPicker({ meals, onSelect }: MealPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return meals
    return meals.filter((m) => m.name.toLowerCase().includes(q))
  }, [meals, query])

  return (
    <div className="stack">
      <SearchBar value={query} onChange={setQuery} placeholder="Search meals…" />
      {filtered.length === 0 ? (
        <p className="text-muted">No meals match.</p>
      ) : (
        <div className="list">
          {filtered.map((meal) => (
            <button key={meal.id} type="button" className="list-row" onClick={() => onSelect(meal)}>
              <span>{meal.name}</span>
              <span className="text-sm text-muted">{meal.total_portions} portions</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
