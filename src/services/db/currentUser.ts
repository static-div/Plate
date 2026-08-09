import { getDriver } from './connection'
import { newId, nowIso } from './rowHelpers'

let cachedUserId: string | null = null

/**
 * The single source of the active user_id (invariant 4). Real call sites
 * (UI/hooks) get the id from here rather than hardcoding one; entity
 * functions still take userId explicitly so they stay testable with
 * synthetic ids.
 */
export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId

  const driver = getDriver()
  const existing = await driver.query<{ id: string }>(
    'SELECT id FROM user WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1',
  )
  if (existing[0]) {
    cachedUserId = existing[0].id
    return cachedUserId
  }

  const id = newId()
  const now = nowIso()
  await driver.run('INSERT INTO user (id, email, created_at, updated_at) VALUES (?, NULL, ?, ?)', [
    id,
    now,
    now,
  ])
  cachedUserId = id
  return id
}

/** Test-only: forces the next getCurrentUserId() call to re-query. */
export function resetCurrentUserCache(): void {
  cachedUserId = null
}
