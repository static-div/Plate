import { getDriver } from './db/connection'
import { ACTIVE_FILTER, newId, nowIso } from './db/rowHelpers'
import type { MealIngredientRow } from './db/types'
import { getMeal } from './meal'
import { snapshotFromFood } from './macroSnapshot'

export interface CreateMealIngredientInput {
  meal_id: string
  food_id: string
  quantity: number
  quantity_unit: string
}

export type UpdateMealIngredientInput = Partial<Pick<CreateMealIngredientInput, 'quantity' | 'quantity_unit'>>

export async function createMealIngredient(
  userId: string,
  input: CreateMealIngredientInput,
): Promise<MealIngredientRow> {
  const meal = await getMeal(userId, input.meal_id)
  if (!meal) throw new Error(`createMealIngredient: meal ${input.meal_id} not found or not active`)

  const snapshot = await snapshotFromFood(userId, input.food_id, input.quantity, input.quantity_unit)

  const driver = getDriver()
  const id = newId()
  const now = nowIso()
  await driver.run(
    `INSERT INTO meal_ingredient
       (id, user_id, meal_id, food_id, quantity, quantity_unit, s_name, s_calories, s_protein_g, s_carbs_g, s_fat_g, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.meal_id,
      input.food_id,
      input.quantity,
      input.quantity_unit,
      snapshot.s_name,
      snapshot.s_calories,
      snapshot.s_protein_g,
      snapshot.s_carbs_g,
      snapshot.s_fat_g,
      now,
      now,
    ],
  )
  const row = await getMealIngredient(userId, id)
  if (!row) throw new Error('createMealIngredient: insert succeeded but row not found')
  return row
}

export async function getMealIngredient(userId: string, id: string): Promise<MealIngredientRow | null> {
  const driver = getDriver()
  const rows = await driver.query<MealIngredientRow>(
    `SELECT * FROM meal_ingredient WHERE id = ? AND ${ACTIVE_FILTER}`,
    [id, userId],
  )
  return rows[0] ?? null
}

export async function listMealIngredientsByMeal(
  userId: string,
  mealId: string,
): Promise<MealIngredientRow[]> {
  const driver = getDriver()
  return driver.query<MealIngredientRow>(
    `SELECT * FROM meal_ingredient WHERE meal_id = ? AND ${ACTIVE_FILTER}`,
    [mealId, userId],
  )
}

/** Re-derives the snapshot from the current active food — "snapshot on
 * write" applies to every write, not just creation. Throws if the source
 * food is no longer active. */
export async function updateMealIngredient(
  userId: string,
  id: string,
  patch: UpdateMealIngredientInput,
): Promise<MealIngredientRow> {
  const existing = await getMealIngredient(userId, id)
  if (!existing) throw new Error(`updateMealIngredient: no active meal_ingredient ${id} for user ${userId}`)
  if (!existing.food_id) {
    throw new Error(`updateMealIngredient: ${id} has no food_id, cannot re-derive a snapshot`)
  }

  const quantity = patch.quantity ?? existing.quantity
  const quantityUnit = patch.quantity_unit ?? existing.quantity_unit
  const snapshot = await snapshotFromFood(userId, existing.food_id, quantity, quantityUnit)

  const driver = getDriver()
  await driver.run(
    `UPDATE meal_ingredient
     SET quantity = ?, quantity_unit = ?, s_name = ?, s_calories = ?, s_protein_g = ?, s_carbs_g = ?, s_fat_g = ?, updated_at = ?
     WHERE id = ? AND ${ACTIVE_FILTER}`,
    [
      quantity,
      quantityUnit,
      snapshot.s_name,
      snapshot.s_calories,
      snapshot.s_protein_g,
      snapshot.s_carbs_g,
      snapshot.s_fat_g,
      nowIso(),
      id,
      userId,
    ],
  )
  const row = await getMealIngredient(userId, id)
  if (!row) throw new Error('updateMealIngredient: row not found after update')
  return row
}

export async function deleteMealIngredient(userId: string, id: string): Promise<void> {
  const driver = getDriver()
  await driver.run(
    `UPDATE meal_ingredient SET deleted_at = ?, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`,
    [nowIso(), nowIso(), id, userId],
  )
}
