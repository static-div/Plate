import { scaleMacros } from '../lib/calculations/macros'
import { foodMacros, macrosToSnapshotColumns } from './db/types'
import { getFood } from './food'

/**
 * The one place a food's macros get scaled and copied into a snapshot.
 * Used by both meal_ingredient and food-sourced diary_entry writes so that
 * logging the same amount directly or via a recipe stays identical.
 */
export async function snapshotFromFood(userId: string, foodId: string, quantity: number, quantityUnit: string) {
  const food = await getFood(userId, foodId)
  if (!food) throw new Error(`food ${foodId} not found or not active`)
  if (quantityUnit !== food.serving_unit) {
    throw new Error(
      `quantity_unit "${quantityUnit}" must match food serving_unit "${food.serving_unit}"`,
    )
  }
  const scaled = scaleMacros(foodMacros(food), quantity, food.serving_size)
  return { s_name: food.name, ...macrosToSnapshotColumns(scaled) }
}
