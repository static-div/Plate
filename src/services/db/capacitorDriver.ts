import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import type { SqlDriver } from './driver'

const DB_NAME = 'plate'

export async function createCapacitorDriver(): Promise<SqlDriver> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)

  const alreadyOpen = (await sqlite.isConnection(DB_NAME, false)).result
  const db: SQLiteDBConnection = alreadyOpen
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)

  await db.open()
  await db.execute('PRAGMA foreign_keys = ON;')

  return {
    async execute(sql) {
      // transaction=false: our own transaction() below is the sole owner of
      // BEGIN/COMMIT boundaries. Letting this self-wrap would nest transactions.
      await db.execute(sql, false)
    },
    async run(sql, params = []) {
      const result = await db.run(sql, params, false)
      return { changes: result.changes?.changes ?? 0 }
    },
    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
      const result = await db.query(sql, params)
      return (result.values ?? []) as T[]
    },
    async transaction(fn) {
      await db.beginTransaction()
      try {
        const result = await fn()
        await db.commitTransaction()
        return result
      } catch (err) {
        await db.rollbackTransaction()
        throw err
      }
    },
    async close() {
      await sqlite.closeConnection(DB_NAME, false)
    },
  }
}
