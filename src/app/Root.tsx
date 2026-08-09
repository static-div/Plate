import { useEffect, useState } from 'react'
import { getCurrentUserId } from '../services/db/currentUser'
import { initDatabase } from '../services/db/connection'
import { getProfile } from '../services/profile'
import { AppRoutes } from './AppRoutes'
import { SelectedDateProvider } from './SelectedDateProvider'
import { UserIdProvider } from './UserIdProvider'

type BootState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string; hasProfile: boolean }
  | { status: 'error'; message: string }

/** Opens the database, resolves the single local user, and checks whether
 * onboarding is needed — all before any route renders, so there's no flash
 * of the wrong screen while that resolves. */
export function Root() {
  const [boot, setBoot] = useState<BootState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        await initDatabase()
        const userId = await getCurrentUserId()
        const profile = await getProfile(userId)
        if (!cancelled) setBoot({ status: 'ready', userId, hasProfile: profile !== null })
      } catch (err) {
        if (!cancelled) {
          setBoot({ status: 'error', message: err instanceof Error ? err.message : String(err) })
        }
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  if (boot.status === 'loading') {
    return (
      <div className="screen">
        <p className="text-muted">Loading…</p>
      </div>
    )
  }

  if (boot.status === 'error') {
    return (
      <div className="screen">
        <p className="heading">Something went wrong</p>
        <p className="text-muted">{boot.message}</p>
      </div>
    )
  }

  return (
    <UserIdProvider userId={boot.userId}>
      <SelectedDateProvider>
        <AppRoutes hasProfile={boot.hasProfile} />
      </SelectedDateProvider>
    </UserIdProvider>
  )
}
