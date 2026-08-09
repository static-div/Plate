import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { MealEditor } from '../components/meal/MealEditor'
import { MealForm } from '../components/meal/MealForm'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { useSelectedDate } from '../hooks/useSelectedDate'
import { errorMessage } from '../lib/errorMessage'
import type { FoodRow, MealIngredientRow, MealRow } from '../services/db/types'
import { createDiaryEntry } from '../services/diaryEntry'
import { listFoods } from '../services/food'
import { createMeal, getMeal, updateMeal, type CreateMealInput } from '../services/meal'
import { createMealIngredient, deleteMealIngredient, listMealIngredientsByMeal } from '../services/mealIngredient'

export function MealEditPage() {
  const { id } = useParams()
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useSelectedDate()

  const [meal, setMeal] = useState<MealRow | null>(null)
  const [ingredients, setIngredients] = useState<MealIngredientRow[]>([])
  const [foods, setFoods] = useState<FoodRow[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [justLogged, setJustLogged] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!id) return
    const [mealRow, mealIngredients] = await Promise.all([
      getMeal(userId, id),
      listMealIngredientsByMeal(userId, id),
    ])
    setMeal(mealRow)
    setIngredients(mealIngredients)
    setLoading(false)
  }, [id, userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    listFoods(userId)
      .then(setFoods)
      .catch((err: unknown) => setError(errorMessage(err)))
  }, [userId])

  async function handleCreate(values: Pick<CreateMealInput, 'name' | 'total_portions'>) {
    try {
      setError(null)
      const created = await createMeal(userId, values)
      navigate(`/meals/${created.id}`, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleUpdate(values: Pick<CreateMealInput, 'name' | 'total_portions'>) {
    if (!id) return
    try {
      setError(null)
      await updateMeal(userId, id, values)
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleAddIngredient(food: FoodRow, quantity: number) {
    if (!id) return
    try {
      setError(null)
      await createMealIngredient(userId, {
        meal_id: id,
        food_id: food.id,
        quantity,
        quantity_unit: food.serving_unit,
      })
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleRemoveIngredient(ingredient: MealIngredientRow) {
    try {
      setError(null)
      await deleteMealIngredient(userId, ingredient.id)
      await refresh()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleLogToDiary(portions: number) {
    if (!id) return
    try {
      setError(null)
      await createDiaryEntry(userId, {
        date: selectedDate,
        source_type: 'meal',
        source_id: id,
        quantity: portions,
        quantity_unit: 'portion',
      })
      setJustLogged(true)
      setTimeout(() => setJustLogged(false), 2000)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!id) {
    return (
      <div className="page">
        <h1 className="heading">New meal</h1>
        <MealForm onSubmit={handleCreate} submitLabel="Create meal" />
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }

  if (loading || !meal) {
    return (
      <div className="page">
        <p className="text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <MealEditor
      meal={meal}
      ingredients={ingredients}
      foods={foods}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      onUpdateMeal={handleUpdate}
      onAddIngredient={handleAddIngredient}
      onRemoveIngredient={handleRemoveIngredient}
      onLogToDiary={handleLogToDiary}
      justLogged={justLogged}
      error={error}
    />
  )
}
