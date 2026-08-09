import { getDriver } from './db/connection'
import { ACTIVE_FILTER, newId, nowIso } from './db/rowHelpers'
import type { ProfileRow } from './db/types'

export interface CreateProfileInput {
  height_cm: number
  age: number
  sex: 'male' | 'female'
  activity_level?: string
}

export type UpdateProfileInput = Partial<CreateProfileInput>

export async function createProfile(userId: string, input: CreateProfileInput): Promise<ProfileRow> {
  const driver = getDriver()
  const id = newId()
  const now = nowIso()
  await driver.run(
    `INSERT INTO profile (id, user_id, height_cm, age, sex, activity_level, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.height_cm, input.age, input.sex, input.activity_level ?? 'sedentary', now, now],
  )
  const row = await getProfile(userId)
  if (!row) throw new Error('createProfile: insert succeeded but row not found')
  return row
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const driver = getDriver()
  const rows = await driver.query<ProfileRow>(`SELECT * FROM profile WHERE ${ACTIVE_FILTER}`, [userId])
  return rows[0] ?? null
}

export async function updateProfile(
  userId: string,
  id: string,
  patch: UpdateProfileInput,
): Promise<ProfileRow> {
  const driver = getDriver()
  const fields = Object.keys(patch) as (keyof UpdateProfileInput)[]
  if (fields.length === 0) {
    const row = await getProfile(userId)
    if (!row) throw new Error(`updateProfile: no active profile for user ${userId}`)
    return row
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  const values = fields.map((f) => patch[f])
  const { changes } = await driver.run(
    `UPDATE profile SET ${setClause}, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`,
    [...values, nowIso(), id, userId],
  )
  if (changes === 0) throw new Error(`updateProfile: no active profile ${id} for user ${userId}`)

  const row = await getProfile(userId)
  if (!row) throw new Error('updateProfile: row not found after update')
  return row
}

export async function deleteProfile(userId: string, id: string): Promise<void> {
  const driver = getDriver()
  await driver.run(`UPDATE profile SET deleted_at = ?, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`, [
    nowIso(),
    nowIso(),
    id,
    userId,
  ])
}
