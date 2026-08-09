/** ISO 8601 UTC, no milliseconds — matches the format documented in CLAUDE.md. */
export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function newId(): string {
  return crypto.randomUUID()
}

/** The filter every read applies: invariant 4 (user_id) + invariant 5 (soft delete). */
export const ACTIVE_FILTER = 'user_id = ? AND deleted_at IS NULL'
