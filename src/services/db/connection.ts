import type { SqlDriver } from './driver'
import { createCapacitorDriver } from './capacitorDriver'
import { runMigrations } from './migrate'

let driver: SqlDriver | null = null

/** Used by tests to inject the node driver; used internally by initDatabase(). */
export function setDriver(d: SqlDriver): void {
  driver = d
}

export function getDriver(): SqlDriver {
  if (!driver) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return driver
}

export function resetDriver(): void {
  driver = null
}

/** App entry point: opens the on-device database and brings it up to date. */
export async function initDatabase(): Promise<void> {
  const d = await createCapacitorDriver()
  setDriver(d)
  await runMigrations(d)
}
