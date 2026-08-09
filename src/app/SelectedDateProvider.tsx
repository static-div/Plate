import { useState, type ReactNode } from 'react'
import { SelectedDateContext } from './selectedDateContext'
import { todayLocal } from './todayLocal'

/** Holds the Dashboard's selected date above the router so it survives tab
 * switches instead of resetting every time the Dashboard route remounts. */
export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const state = useState(todayLocal())
  return <SelectedDateContext.Provider value={state}>{children}</SelectedDateContext.Provider>
}
