import { Outlet } from 'react-router'
import { BottomTabBar } from '../components/nav/BottomTabBar'

/** Layout route for the 5 bottom-tab screens: renders the active tab's
 * page via Outlet, with the tab bar fixed below it. */
export function TabShell() {
  return (
    <>
      <Outlet />
      <BottomTabBar />
    </>
  )
}
