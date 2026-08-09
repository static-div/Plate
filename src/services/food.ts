import { getDriver } from './db/connection'
import { ACTIVE_FILTER, newId, nowIso } from './db/rowHelpers'
import type { FoodRow } from './db/types'

export interface CreateFoodInput {
  code?: string | null
  name: string
  brand?: string | null
  serving_size: number
  serving_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  source?: 'manual' | 'openfoodfacts'
}

export type UpdateFoodInput = Partial<CreateFoodInput>

export async function createFood(userId: string, input: CreateFoodInput): Promise<FoodRow> {
  const driver = getDriver()
  const id = newId()
  const now = nowIso()
  await driver.run(
    `INSERT INTO food
       (id, user_id, code, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.code ?? null,
      input.name,
      input.brand ?? null,
      input.serving_size,
      input.serving_unit,
      input.calories,
      input.protein_g,
      input.carbs_g,
      input.fat_g,
      input.source ?? 'manual',
      now,
      now,
    ],
  )
  const row = await getFood(userId, id)
  if (!row) throw new Error('createFood: insert succeeded but row not found')
  return row
}

export async function getFood(userId: string, id: string): Promise<FoodRow | null> {
  const driver = getDriver()
  const rows = await driver.query<FoodRow>(`SELECT * FROM food WHERE id = ? AND ${ACTIVE_FILTER}`, [
    id,
    userId,
  ])
  return rows[0] ?? null
}

export async function listFoods(userId: string): Promise<FoodRow[]> {
  const driver = getDriver()
  return driver.query<FoodRow>(`SELECT * FROM food WHERE ${ACTIVE_FILTER} ORDER BY name`, [userId])
}

export async function updateFood(userId: string, id: string, patch: UpdateFoodInput): Promise<FoodRow> {
  const driver = getDriver()
  const fields = Object.keys(patch) as (keyof UpdateFoodInput)[]
  if (fields.length === 0) {
    const row = await getFood(userId, id)
    if (!row) throw new Error(`updateFood: no active food ${id} for user ${userId}`)
    return row
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  const values = fields.map((f) => patch[f])
  const { changes } = await driver.run(
    `UPDATE food SET ${setClause}, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`,
    [...values, nowIso(), id, userId],
  )
  if (changes === 0) throw new Error(`updateFood: no active food ${id} for user ${userId}`)

  const row = await getFood(userId, id)
  if (!row) throw new Error('updateFood: row not found after update')
  return row
}

export async function deleteFood(userId: string, id: string): Promise<void> {
  const driver = getDriver()
  await driver.run(`UPDATE food SET deleted_at = ?, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`, [
    nowIso(),
    nowIso(),
    id,
    userId,
  ])
}
