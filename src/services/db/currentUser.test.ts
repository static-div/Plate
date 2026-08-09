import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './driver'
import { setupTestDb, teardownTestDb } from './testing/setupTestDb'
import { getCurrentUserId } from './currentUser'

let driver: SqlDriver

beforeEach(async () => {
  driver = await setupTestDb()
})

afterEach(async () => {
  await teardownTestDb(driver)
})

describe('getCurrentUserId', () => {
  it('bootstraps a single user row on first call', async () => {
    const id = await getCurrentUserId()
    const rows = await driver.query('SELECT id FROM user WHERE deleted_at IS NULL')
    expect(rows).toEqual([{ id }])
  })

  it('returns the same id on subsequent calls without creating another row', async () => {
    const first = await getCurrentUserId()
    const second = await getCurrentUserId()
    expect(second).toBe(first)

    const rows = await driver.query('SELECT id FROM user')
    expect(rows).toHaveLength(1)
  })
})
