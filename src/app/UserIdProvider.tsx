import type { ReactNode } from 'react'
import { UserIdContext } from './userIdContext'

export function UserIdProvider({ userId, children }: { userId: string; children: ReactNode }) {
  return <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>
}
