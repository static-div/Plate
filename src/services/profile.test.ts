import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { createProfile, deleteProfile, getProfile, updateProfile } from './profile'

let driver: SqlDriver
let userId: string

beforeEach(async () => {
  driver = await setupTestDb()
  userId = await createTestUser(driver)
})

afterEach(async () => {
  await teardownTestDb(driver)
})

describe('profile CRUD', () => {
  it('creates and reads back a profile, defaulting activity_level', async () => {
    await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    const profile = await getProfile(userId)
    expect(profile).toMatchObject({ height_cm: 180, age: 30, sex: 'male', activity_level: 'sedentary' })
  })

  it('updates fields', async () => {
    const created = await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    const updated = await updateProfile(userId, created.id, { age: 31 })
    expect(updated.age).toBe(31)
  })

  it('soft deletes and allows recreating (partial unique index)', async () => {
    const created = await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    await deleteProfile(userId, created.id)
    expect(await getProfile(userId)).toBeNull()

    await createProfile(userId, { height_cm: 175, age: 25, sex: 'female' })
    const profile = await getProfile(userId)
    expect(profile?.height_cm).toBe(175)
  })

  it('filters strictly by user_id', async () => {
    const otherUserId = await createTestUser(driver)
    await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    await createProfile(otherUserId, { height_cm: 160, age: 40, sex: 'female' })

    const profile = await getProfile(userId)
    expect(profile?.height_cm).toBe(180)
  })
})
