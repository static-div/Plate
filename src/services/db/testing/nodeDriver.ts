import Database from 'better-sqlite3'
import type { SqlDriver } from '../driver'

/**
 * Dev/test-only driver. @capacitor-community/sqlite only runs inside an
 * actual Android/iOS/web webview, so tests run the same SQL against
 * better-sqlite3 instead. Never imported from app code — only from tests.
 */
export function createNodeDriver(location: string = ':memory:'): SqlDriver {
  const db = new Database(location)
  db.pragma('foreign_keys = ON')

  return {
    async execute(sql) {
      db.exec(sql)
    },
    async run(sql, params = []) {
      const info = db.prepare(sql).run(...(params as never[]))
      return { changes: info.changes }
    },
    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).all(...(params as never[])) as T[]
    },
    async transaction(fn) {
      db.exec('BEGIN')
      try {
        const result = await fn()
        db.exec('COMMIT')
        return result
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    },
    async close() {
      db.close()
    },
  }
}
