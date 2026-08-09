import { useState } from 'react'
import { FoodQuantitySheet } from '../food/FoodQuantitySheet'
import type { FoodRow, MealIngredientRow, MealRow } from '../../services/db/types'
import type { CreateMealInput } from '../../services/meal'
import { LogMealToDiary } from './LogMealToDiary'
import { MealForm } from './MealForm'
import { MealIngredientList } from './MealIngredientList'
import { MealMacroSummary } from './MealMacroSummary'

interface MealEditorProps {
  meal: MealRow
  ingredients: MealIngredientRow[]
  foods: FoodRow[]
  selectedDate: string
  onDateChange: (date: string) => void
  onUpdateMeal: (values: Pick<CreateMealInput, 'name' | 'total_portions'>) => void
  onAddIngredient: (food: FoodRow, quantity: number) => void
  onRemoveIngredient: (ingredient: MealIngredientRow) => void
  onLogToDiary: (portions: number) => void
  justLogged: boolean
  error: string | null
}

export function MealEditor({
  meal,
  ingredients,
  foods,
  selectedDate,
  onDateChange,
  onUpdateMeal,
  onAddIngredient,
  onRemoveIngredient,
  onLogToDiary,
  justLogged,
  error,
}: MealEditorProps) {
  const [showAddIngredient, setShowAddIngredient] = useState(false)

  return (
    <div className="page">
      <h1 className="heading">{meal.name}</h1>
      <MealForm initial={meal} onSubmit={onUpdateMeal} submitLabel="Save changes" />
      <div className="stack">
        <span className="field-label">Ingredients</span>
        <MealIngredientList ingredients={ingredients} onRemove={onRemoveIngredient} />
        <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowAddIngredient(true)}>
          Add ingredient
        </button>
      </div>
      <MealMacroSummary ingredients={ingredients} totalPortions={meal.total_portions} />
      <LogMealToDiary date={selectedDate} onDateChange={onDateChange} onLog={onLogToDiary} />
      {justLogged && <p className="text-sm text-muted">Added to diary.</p>}
      {error && <p className="field-error">{error}</p>}
      {showAddIngredient && (
        <FoodQuantitySheet
          foods={foods}
          title="Add ingredient"
          onConfirm={(food, quantity) => {
            onAddIngredient(food, quantity)
            setShowAddIngredient(false)
          }}
          onClose={() => setShowAddIngredient(false)}
        />
      )}
    </div>
  )
}
