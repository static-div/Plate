import { migration0001 } from './0001_initial'
import type { Migration } from './types'

// Add new migrations here, in order. See DECISIONS.md for how to add one.
export const migrations: Migration[] = [migration0001].sort((a, b) => a.version - b.version)
