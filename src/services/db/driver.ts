/**
 * The only interface the data layer talks to. Storage lives behind this
 * seam (CLAUDE.md invariant 2): production runs on SQLite via Capacitor,
 * tests run the same SQL against better-sqlite3, and neither the entity
 * modules nor their callers know which one they're on.
 */
export interface SqlDriver {
  /** Multi-statement DDL/scripts. No parameters. */
  execute(sql: string): Promise<void>
  /** A single parameterized write (INSERT/UPDATE). Returns rows affected. */
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>
  /** A single parameterized read (SELECT). */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  /** Runs fn inside BEGIN/COMMIT, rolling back on throw. */
  transaction<T>(fn: () => Promise<T>): Promise<T>
  close(): Promise<void>
}
