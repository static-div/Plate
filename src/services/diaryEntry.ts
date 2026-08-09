import { getDriver } from './db/connection'
import { ACTIVE_FILTER, newId, nowIso } from './db/rowHelpers'
import type { DiaryEntryRow } from './db/types'
import { computeDiaryEntrySnapshot } from './diaryEntrySnapshot'

export interface CreateDiaryEntryInput {
  date: string
  source_type: 'food' | 'meal'
  source_id: string
  quantity: number
  quantity_unit: string
}

export type UpdateDiaryEntryInput = Partial<Pick<CreateDiaryEntryInput, 'quantity' | 'quantity_unit'>>

export async function createDiaryEntry(
  userId: string,
  input: CreateDiaryEntryInput,
): Promise<DiaryEntryRow> {
  const snapshot = await computeDiaryEntrySnapshot(
    userId,
    input.source_type,
    input.source_id,
    input.quantity,
    input.quantity_unit,
  )

  const driver = getDriver()
  const id = newId()
  const now = nowIso()
  await driver.run(
    `INSERT INTO diary_entry
       (id, user_id, date, source_type, source_id, quantity, quantity_unit, s_name, s_calories, s_protein_g, s_carbs_g, s_fat_g, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.date,
      input.source_type,
      input.source_id,
      input.quantity,
      input.quantity_unit,
      snapshot.s_name,
      snapshot.s_calories,
      snapshot.s_protein_g,
      snapshot.s_carbs_g,
      snapshot.s_fat_g,
      now,
      now,
    ],
  )
  const row = await getDiaryEntry(userId, id)
  if (!row) throw new Error('createDiaryEntry: insert succeeded but row not found')
  return row
}

export async function getDiaryEntry(userId: string, id: string): Promise<DiaryEntryRow | null> {
  const driver = getDriver()
  const rows = await driver.query<DiaryEntryRow>(
    `SELECT * FROM diary_entry WHERE id = ? AND ${ACTIVE_FILTER}`,
    [id, userId],
  )
  return rows[0] ?? null
}

/** One row per date that has at least one entry, summed from active
 * snapshots. Dates with no entries are simply absent, never zero-filled —
 * that's the caller's (e.g. computeObservedTdee's) job to interpret. */
export async function listDailyCalorieTotals(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ date: string; calories: number }[]> {
  const driver = getDriver()
  return driver.query<{ date: string; calories: number }>(
    `SELECT date, SUM(s_calories) AS calories FROM diary_entry
     WHERE date >= ? AND date <= ? AND ${ACTIVE_FILTER}
     GROUP BY date`,
    [startDate, endDate, userId],
  )
}

export async function listDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntryRow[]> {
  const driver = getDriver()
  return driver.query<DiaryEntryRow>(`SELECT * FROM diary_entry WHERE date = ? AND ${ACTIVE_FILTER}`, [
    date,
    userId,
  ])
}

/** Re-derives the snapshot from the current active source (food or meal) —
 * "snapshot on write" applies to every write, not just creation. Throws if
 * the source is no longer active. */
export async function updateDiaryEntry(
  userId: string,
  id: string,
  patch: UpdateDiaryEntryInput,
): Promise<DiaryEntryRow> {
  const existing = await getDiaryEntry(userId, id)
  if (!existing) throw new Error(`updateDiaryEntry: no active diary_entry ${id} for user ${userId}`)
  if (!existing.source_id) {
    throw new Error(`updateDiaryEntry: ${id} has no source_id, cannot re-derive a snapshot`)
  }

  const quantity = patch.quantity ?? existing.quantity
  const quantityUnit = patch.quantity_unit ?? existing.quantity_unit
  const snapshot = await computeDiaryEntrySnapshot(
    userId,
    existing.source_type,
    existing.source_id,
    quantity,
    quantityUnit,
  )

  const driver = getDriver()
  await driver.run(
    `UPDATE diary_entry
     SET quantity = ?, quantity_unit = ?, s_name = ?, s_calories = ?, s_protein_g = ?, s_carbs_g = ?, s_fat_g = ?, updated_at = ?
     WHERE id = ? AND ${ACTIVE_FILTER}`,
    [
      quantity,
      quantityUnit,
      snapshot.s_name,
      snapshot.s_calories,
      snapshot.s_protein_g,
      snapshot.s_carbs_g,
      snapshot.s_fat_g,
      nowIso(),
      id,
      userId,
    ],
  )
  const row = await getDiaryEntry(userId, id)
  if (!row) throw new Error('updateDiaryEntry: row not found after update')
  return row
}

export async function deleteDiaryEntry(userId: string, id: string): Promise<void> {
  const driver = getDriver()
  await driver.run(`UPDATE diary_entry SET deleted_at = ?, updated_at = ? WHERE id = ? AND ${ACTIVE_FILTER}`, [
    nowIso(),
    nowIso(),
    id,
    userId,
  ])
}
