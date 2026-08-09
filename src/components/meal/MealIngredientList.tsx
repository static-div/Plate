import type { MealIngredientRow } from '../../services/db/types'

interface MealIngredientListProps {
  ingredients: MealIngredientRow[]
  onRemove: (ingredient: MealIngredientRow) => void
}

export function MealIngredientList({ ingredients, onRemove }: MealIngredientListProps) {
  if (ingredients.length === 0) {
    return <p className="text-muted">No ingredients yet.</p>
  }

  return (
    <div className="list">
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className="list-row">
          <div className="stack-tight">
            <span>{ingredient.s_name}</span>
            <span className="text-sm text-muted">
              {ingredient.quantity}
              {ingredient.quantity_unit} · {Math.round(ingredient.s_calories)} kcal
            </span>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-secondary"
            aria-label={`Remove ${ingredient.s_name}`}
            onClick={() => onRemove(ingredient)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
