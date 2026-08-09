import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { FoodListItem } from '../components/food/FoodListItem'
import { SearchBar } from '../components/common/SearchBar'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { errorMessage } from '../lib/errorMessage'
import type { FoodRow } from '../services/db/types'
import { deleteFood, listFoods } from '../services/food'

export function FoodListPage() {
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const [foods, setFoods] = useState<FoodRow[]>([])
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<FoodRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setFoods(await listFoods(userId))
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = foods.filter((f) => {
    const q = query.trim().toLowerCase()
    return !q || f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)
  })

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      setError(null)
      await deleteFood(userId, pendingDelete.id)
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="page">
      <h1 className="heading">Food</h1>
      <SearchBar value={query} onChange={setQuery} placeholder="Search foods…" />
      {error && <p className="field-error">{error}</p>}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No foods yet.</p>
        </div>
      ) : (
        <div className="list">
          {filtered.map((food) => (
            <FoodListItem
              key={food.id}
              food={food}
              onSelect={() => navigate(`/food/${food.id}`)}
              onDelete={() => setPendingDelete(food)}
            />
          ))}
        </div>
      )}
      <button type="button" className="fab" aria-label="Add food" onClick={() => navigate('/food/new')}>
        +
      </button>
      {pendingDelete && (
        <ConfirmDialog
          title="Delete food?"
          message={`"${pendingDelete.name}" will be removed from your catalog.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
