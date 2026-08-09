import type { SqlDriver } from './driver'
import type { Migration } from './migrations/types'
import { migrations as productionMigrations } from './migrations'

async function getCurrentVersion(driver: SqlDriver): Promise<number> {
  const tables = await driver.query<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'",
  )
  if (tables.length === 0) return 0

  const rows = await driver.query<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_version',
  )
  return rows[0]?.version ?? 0
}

/**
 * Applies every migration with version > the current schema_version, in
 * order. On a fresh database this is just migration 1 (the full schema),
 * which is how "create the schema on first launch" and "the migration
 * system" end up being the same code path.
 */
export async function runMigrations(
  driver: SqlDriver,
  migrations: Migration[] = productionMigrations,
): Promise<void> {
  const currentVersion = await getCurrentVersion(driver)
  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version)

  for (const migration of pending) {
    await driver.transaction(async () => {
      await driver.execute(migration.up)
      await driver.run('INSERT INTO schema_version (version) VALUES (?)', [migration.version])
    })
  }
}
