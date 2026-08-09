import { scaleMacros, sumMacros } from '../../lib/calculations/macros'
import { snapshotMacros } from '../../services/db/types'
import type { MealIngredientRow } from '../../services/db/types'

interface MealMacroSummaryProps {
  ingredients: MealIngredientRow[]
  totalPortions: number
}

export function MealMacroSummary({ ingredients, totalPortions }: MealMacroSummaryProps) {
  const total = sumMacros(ingredients.map(snapshotMacros))
  const perPortion = scaleMacros(total, 1, totalPortions)

  return (
    <div className="card stack">
      <div className="row-between">
        <span className="field-label">Total</span>
        <span className="text-lg">{Math.round(total.calories)} kcal</span>
      </div>
      <div className="row-between text-sm text-muted">
        <span>{Math.round(total.protein_g)}g protein</span>
        <span>{Math.round(total.carbs_g)}g carbs</span>
        <span>{Math.round(total.fat_g)}g fat</span>
      </div>
      <div className="row-between">
        <span className="field-label">Per portion</span>
        <span className="text-lg">{Math.round(perPortion.calories)} kcal</span>
      </div>
    </div>
  )
}
