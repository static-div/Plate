import { getDriver } from './db/connection'
import { ACTIVE_FILTER, newId, nowIso } from './db/rowHelpers'
import type { BodyLogRow } from './db/types'

export interface UpsertBodyLogInput {
  date: string
  weight_kg: number
  body_fat_percent?: number | null
  body_fat_method?: BodyLogRow['body_fat_method']
  notes?: string | null
}

/**
 * body_log has one active row per (user_id, date) — see the partial unique
 * index in SCHEMA.sql — so the write path is upsert, not separate
 * create/update calls.
 */
export async function upsertBodyLog(userId: string, input: UpsertBodyLogInput): Promise<BodyLogRow> {
  const driver = getDriver()
  const id = newId()
  const now = nowIso()
  await driver.run(
    `INSERT INTO body_log (id, user_id, date, weight_kg, body_fat_percent, body_fat_method, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, date) WHERE deleted_at IS NULL DO UPDATE SET
       weight_kg = excluded.weight_kg,
       body_fat_percent = excluded.body_fat_percent,
       body_fat_method = excluded.body_fat_method,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
    [
      id,
      userId,
      input.date,
      input.weight_kg,
      input.body_fat_percent ?? null,
      input.body_fat_method ?? null,
      input.notes ?? null,
      now,
      now,
    ],
  )
  const row = await getBodyLog(userId, input.date)
  if (!row) throw new Error('upsertBodyLog: write succeeded but row not found')
  return row
}

export async function getBodyLog(userId: string, date: string): Promise<BodyLogRow | null> {
  const driver = getDriver()
  const rows = await driver.query<BodyLogRow>(`SELECT * FROM body_log WHERE date = ? AND ${ACTIVE_FILTER}`, [
    date,
    userId,
  ])
  return rows[0] ?? null
}

export async function listBodyLogs(userId: string): Promise<BodyLogRow[]> {
  const driver = getDriver()
  return driver.query<BodyLogRow>(`SELECT * FROM body_log WHERE ${ACTIVE_FILTER} ORDER BY date`, [userId])
}

export async function deleteBodyLog(userId: string, id: string): Promise<void> {
  const driver = getDriver()
  await driver.run(`UPDATE body_log SET deleted_at = ?, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`, [
    nowIso(),
    nowIso(),
    id,
    userId,
  ])
}
