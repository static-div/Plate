import { resetCurrentUserCache } from '../currentUser'
import { resetDriver, setDriver } from '../connection'
import type { SqlDriver } from '../driver'
import { runMigrations } from '../migrate'
import { newId, nowIso } from '../rowHelpers'
import { createNodeDriver } from './nodeDriver'

export async function setupTestDb(): Promise<SqlDriver> {
  const driver = createNodeDriver(':memory:')
  setDriver(driver)
  await runMigrations(driver)
  resetCurrentUserCache()
  return driver
}

export async function teardownTestDb(driver: SqlDriver): Promise<void> {
  await driver.close()
  resetDriver()
  resetCurrentUserCache()
}

/** Inserts a bare user row directly, bypassing currentUser's single-user
 * cache, so tests can create as many synthetic users as they need to prove
 * user_id filtering actually filters. */
export async function createTestUser(driver: SqlDriver): Promise<string> {
  const id = newId()
  const now = nowIso()
  await driver.run('INSERT INTO user (id, email, created_at, updated_at) VALUES (?, NULL, ?, ?)', [
    id,
    now,
    now,
  ])
  return id
}
