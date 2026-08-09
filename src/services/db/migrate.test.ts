import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeDriver } from './testing/nodeDriver'
import type { SqlDriver } from './driver'
import { runMigrations } from './migrate'
import type { Migration } from './migrations/types'
import { migrations as productionMigrations } from './migrations'

let driver: SqlDriver

beforeEach(() => {
  driver = createNodeDriver(':memory:')
})

afterEach(async () => {
  await driver.close()
})

describe('runMigrations', () => {
  it('applies the initial migration to a fresh database', async () => {
    await runMigrations(driver, productionMigrations)
    const versions = await driver.query<{ version: number }>('SELECT version FROM schema_version')
    expect(versions).toEqual([{ version: 1 }])

    const tables = await driver.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    expect(tables.map((t) => t.name)).toContain('food')
    expect(tables.map((t) => t.name)).toContain('diary_entry')
  })

  it('is a no-op when already at the latest version', async () => {
    await runMigrations(driver, productionMigrations)
    await runMigrations(driver, productionMigrations)
    const versions = await driver.query('SELECT version FROM schema_version')
    expect(versions).toHaveLength(1)
  })

  it('applies a newly added migration on top of an existing database', async () => {
    // This is the shape of adding a migration later: a new file exporting
    // { version, up }, appended to the list passed to the runner.
    const addTestColumn: Migration = {
      version: 2,
      up: 'ALTER TABLE food ADD COLUMN fiber_g REAL;',
    }

    await runMigrations(driver, productionMigrations)
    await runMigrations(driver, [...productionMigrations, addTestColumn])

    const versions = await driver.query<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version',
    )
    expect(versions).toEqual([{ version: 1 }, { version: 2 }])

    const columns = await driver.query<{ name: string }>('PRAGMA table_info(food)')
    expect(columns.map((c) => c.name)).toContain('fiber_g')
  })
})
