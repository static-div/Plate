import { useContext } from 'react'
import { SelectedDateContext } from '../app/selectedDateContext'

export function useSelectedDate() {
  const value = useContext(SelectedDateContext)
  if (!value) {
    throw new Error('useSelectedDate() called outside SelectedDateProvider')
  }
  return value
}
