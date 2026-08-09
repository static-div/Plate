import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { deleteBodyLog, getBodyLog, listBodyLogs, upsertBodyLog } from './bodyLog'

let driver: SqlDriver
let userId: string

beforeEach(async () => {
  driver = await setupTestDb()
  userId = await createTestUser(driver)
})

afterEach(async () => {
  await teardownTestDb(driver)
})

describe('body_log upsert', () => {
  it('creates a row on first log for a date', async () => {
    const row = await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 80 })
    expect(row.weight_kg).toBe(80)
  })

  it('updates the same row in place when logging the same date again', async () => {
    const first = await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 80 })
    const second = await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 81.5 })

    expect(second.id).toBe(first.id)
    expect(second.weight_kg).toBe(81.5)
    expect(await listBodyLogs(userId)).toHaveLength(1)
  })

  it('allows re-logging a date whose entry was soft-deleted (partial unique index)', async () => {
    const first = await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 80 })
    await deleteBodyLog(userId, first.id)

    expect(await getBodyLog(userId, '2026-08-09')).toBeNull()

    const second = await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 79 })
    expect(second.id).not.toBe(first.id)
    expect(await listBodyLogs(userId)).toEqual([second])
  })

  it('rejects a body_fat_percent without a body_fat_method (schema CHECK constraint)', async () => {
    await expect(
      upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 80, body_fat_percent: 15 }),
    ).rejects.toThrow()
  })

  it('filters strictly by user_id', async () => {
    const otherUserId = await createTestUser(driver)
    await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 80 })
    await upsertBodyLog(otherUserId, { date: '2026-08-09', weight_kg: 60 })

    const mine = await listBodyLogs(userId)
    expect(mine).toHaveLength(1)
    expect(mine[0].weight_kg).toBe(80)
  })
})
