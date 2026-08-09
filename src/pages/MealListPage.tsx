import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { MealListItem } from '../components/meal/MealListItem'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import type { MealRow } from '../services/db/types'
import { deleteMeal, listMeals } from '../services/meal'

export function MealListPage() {
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const [meals, setMeals] = useState<MealRow[]>([])
  const [pendingDelete, setPendingDelete] = useState<MealRow | null>(null)

  const refresh = useCallback(async () => {
    setMeals(await listMeals(userId))
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteMeal(userId, pendingDelete.id)
    setPendingDelete(null)
    await refresh()
  }

  return (
    <div className="page">
      <h1 className="heading">Meals</h1>
      {meals.length === 0 ? (
        <div className="empty-state">
          <p>No meals yet.</p>
        </div>
      ) : (
        <div className="list">
          {meals.map((meal) => (
            <MealListItem
              key={meal.id}
              meal={meal}
              onSelect={() => navigate(`/meals/${meal.id}`)}
              onDelete={() => setPendingDelete(meal)}
            />
          ))}
        </div>
      )}
      <button type="button" className="fab" aria-label="Add meal" onClick={() => navigate('/meals/new')}>
        +
      </button>
      {pendingDelete && (
        <ConfirmDialog
          title="Delete meal?"
          message={`"${pendingDelete.name}" will be removed.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
