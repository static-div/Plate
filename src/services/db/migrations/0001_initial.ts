import schemaSql from '../../../../SCHEMA.sql?raw'
import type { Migration } from './types'

// The canonical schema lives in SCHEMA.sql at the repo root; this migration
// just applies it verbatim so there's one definition, not two.
export const migration0001: Migration = {
  version: 1,
  up: schemaSql,
}
