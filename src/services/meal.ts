import { getDriver } from './db/connection'
import { ACTIVE_FILTER, newId, nowIso } from './db/rowHelpers'
import type { MealRow } from './db/types'

export interface CreateMealInput {
  name: string
  total_portions: number
  method?: string | null
  photo_path?: string | null
}

export type UpdateMealInput = Partial<CreateMealInput>

export async function createMeal(userId: string, input: CreateMealInput): Promise<MealRow> {
  const driver = getDriver()
  const id = newId()
  const now = nowIso()
  await driver.run(
    `INSERT INTO meal (id, user_id, name, total_portions, method, photo_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.total_portions, input.method ?? null, input.photo_path ?? null, now, now],
  )
  const row = await getMeal(userId, id)
  if (!row) throw new Error('createMeal: insert succeeded but row not found')
  return row
}

export async function getMeal(userId: string, id: string): Promise<MealRow | null> {
  const driver = getDriver()
  const rows = await driver.query<MealRow>(`SELECT * FROM meal WHERE id = ? AND ${ACTIVE_FILTER}`, [
    id,
    userId,
  ])
  return rows[0] ?? null
}

export async function listMeals(userId: string): Promise<MealRow[]> {
  const driver = getDriver()
  return driver.query<MealRow>(`SELECT * FROM meal WHERE ${ACTIVE_FILTER} ORDER BY name`, [userId])
}

export async function updateMeal(userId: string, id: string, patch: UpdateMealInput): Promise<MealRow> {
  const driver = getDriver()
  const fields = Object.keys(patch) as (keyof UpdateMealInput)[]
  if (fields.length === 0) {
    const row = await getMeal(userId, id)
    if (!row) throw new Error(`updateMeal: no active meal ${id} for user ${userId}`)
    return row
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  const values = fields.map((f) => patch[f])
  const { changes } = await driver.run(
    `UPDATE meal SET ${setClause}, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`,
    [...values, nowIso(), id, userId],
  )
  if (changes === 0) throw new Error(`updateMeal: no active meal ${id} for user ${userId}`)

  const row = await getMeal(userId, id)
  if (!row) throw new Error('updateMeal: row not found after update')
  return row
}

/** Soft delete only. Does not cascade to meal_ingredient rows — they remain
 * as historical/traceability records (same reasoning as food deletion). */
export async function deleteMeal(userId: string, id: string): Promise<void> {
  const driver = getDriver()
  await driver.run(`UPDATE meal SET deleted_at = ?, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`, [
    nowIso(),
    nowIso(),
    id,
    userId,
  ])
}
