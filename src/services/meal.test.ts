import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { createMeal, deleteMeal, getMeal, listMeals, updateMeal } from './meal'

let driver: SqlDriver
let userId: string

beforeEach(async () => {
  driver = await setupTestDb()
  userId = await createTestUser(driver)
})

afterEach(async () => {
  await teardownTestDb(driver)
})

describe('meal CRUD', () => {
  it('creates and reads back a meal', async () => {
    const created = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 4 })
    expect(await getMeal(userId, created.id)).toMatchObject({ name: 'Chicken rice bowl', total_portions: 4 })
  })

  it('updates fields', async () => {
    const created = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 4 })
    const updated = await updateMeal(userId, created.id, { total_portions: 6 })
    expect(updated.total_portions).toBe(6)
  })

  it('soft deletes: the row stops appearing in get/list', async () => {
    const created = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 4 })
    await deleteMeal(userId, created.id)
    expect(await getMeal(userId, created.id)).toBeNull()
    expect(await listMeals(userId)).toEqual([])
  })

  it('filters strictly by user_id', async () => {
    const otherUserId = await createTestUser(driver)
    const mine = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 4 })
    await createMeal(otherUserId, { name: "Other user's meal", total_portions: 2 })

    expect(await listMeals(userId)).toEqual([mine])
  })
})
