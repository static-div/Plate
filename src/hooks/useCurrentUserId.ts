import { useContext } from 'react'
import { UserIdContext } from '../app/userIdContext'

/** The single source of the active user_id for UI code (invariant 4).
 * Resolved once at app bootstrap (src/app/Root.tsx); every component below
 * that point reads it from context rather than re-resolving it. */
export function useCurrentUserId(): string {
  const userId = useContext(UserIdContext)
  if (!userId) {
    throw new Error('useCurrentUserId() called outside UserIdProvider')
  }
  return userId
}
