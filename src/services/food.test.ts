import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { createFood, deleteFood, getFood, listFoods, updateFood } from './food'

let driver: SqlDriver
let userId: string

beforeEach(async () => {
  driver = await setupTestDb()
  userId = await createTestUser(driver)
})

afterEach(async () => {
  await teardownTestDb(driver)
})

const chicken = {
  name: 'Chicken breast',
  serving_size: 100,
  serving_unit: 'g',
  calories: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
}

describe('food CRUD', () => {
  it('creates and reads back a food', async () => {
    const created = await createFood(userId, chicken)
    const fetched = await getFood(userId, created.id)
    expect(fetched).toMatchObject(chicken)
  })

  it('lists foods for a user', async () => {
    await createFood(userId, chicken)
    await createFood(userId, { ...chicken, name: 'Rice', code: null })
    const foods = await listFoods(userId)
    expect(foods.map((f) => f.name).sort()).toEqual(['Chicken breast', 'Rice'])
  })

  it('updates a food and bumps updated_at', async () => {
    const created = await createFood(userId, chicken)
    const updated = await updateFood(userId, created.id, { calories: 200 })
    expect(updated.calories).toBe(200)
    expect(updated.updated_at >= created.updated_at).toBe(true)
  })

  it('soft deletes: the row stops appearing in get/list but is not removed', async () => {
    const created = await createFood(userId, chicken)
    await deleteFood(userId, created.id)

    expect(await getFood(userId, created.id)).toBeNull()
    expect(await listFoods(userId)).toEqual([])

    const raw = await driver.query('SELECT * FROM food WHERE id = ?', [created.id])
    expect(raw).toHaveLength(1)
    expect((raw[0] as { deleted_at: string | null }).deleted_at).not.toBeNull()
  })

  it('a soft-deleted barcode can be reused (partial unique index, not a hard UNIQUE)', async () => {
    const first = await createFood(userId, { ...chicken, code: 'BARCODE-1' })
    await deleteFood(userId, first.id)

    const second = await createFood(userId, { ...chicken, code: 'BARCODE-1' })
    expect(second.code).toBe('BARCODE-1')
    expect(await listFoods(userId)).toHaveLength(1)
  })

  it('filters strictly by user_id', async () => {
    const otherUserId = await createTestUser(driver)
    const mine = await createFood(userId, chicken)
    await createFood(otherUserId, { ...chicken, name: "Other user's food" })

    expect(await listFoods(userId)).toEqual([mine])
    expect(await getFood(otherUserId, mine.id)).toBeNull()
  })
})
