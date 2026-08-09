import { useMemo, useState } from 'react'
import type { FoodRow } from '../../services/db/types'
import { SearchBar } from '../common/SearchBar'

interface FoodPickerProps {
  foods: FoodRow[]
  onSelect: (food: FoodRow) => void
}

/** Search + select over the food catalog. Reused anywhere a food needs to
 * be picked (Dashboard quick-add, Meals ingredient picker) — don't
 * duplicate a second food search UI. */
export function FoodPicker({ foods, onSelect }: FoodPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q))
  }, [foods, query])

  return (
    <div className="stack">
      <SearchBar value={query} onChange={setQuery} placeholder="Search foods…" />
      {filtered.length === 0 ? (
        <p className="text-muted">No foods match.</p>
      ) : (
        <div className="list">
          {filtered.map((food) => (
            <button key={food.id} type="button" className="list-row" onClick={() => onSelect(food)}>
              <span>{food.name}</span>
              <span className="text-sm text-muted">
                {food.calories} kcal / {food.serving_size}
                {food.serving_unit}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
