import { scaleMacros, sumMacros } from '../lib/calculations/macros'
import { macrosToSnapshotColumns, snapshotMacros } from './db/types'
import { getMeal } from './meal'
import { listMealIngredientsByMeal } from './mealIngredient'
import { snapshotFromFood } from './macroSnapshot'

export const MEAL_QUANTITY_UNIT = 'portion'

/** diary_entry's snapshot rule: food-sourced entries scale like any other
 * food use (see macroSnapshot.ts); meal-sourced entries scale the meal's
 * summed active-ingredient total by portion count. */
export async function computeDiaryEntrySnapshot(
  userId: string,
  sourceType: 'food' | 'meal',
  sourceId: string,
  quantity: number,
  quantityUnit: string,
) {
  if (sourceType === 'food') {
    return snapshotFromFood(userId, sourceId, quantity, quantityUnit)
  }

  if (quantityUnit !== MEAL_QUANTITY_UNIT) {
    throw new Error(`meal-sourced diary entries must use quantity_unit "${MEAL_QUANTITY_UNIT}"`)
  }
  const meal = await getMeal(userId, sourceId)
  if (!meal) throw new Error(`meal ${sourceId} not found or not active`)

  const ingredients = await listMealIngredientsByMeal(userId, sourceId)
  const total = sumMacros(ingredients.map(snapshotMacros))
  const scaled = scaleMacros(total, quantity, meal.total_portions)
  return { s_name: meal.name, ...macrosToSnapshotColumns(scaled) }
}
