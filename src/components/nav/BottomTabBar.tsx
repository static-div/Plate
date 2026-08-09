import { NavLink } from 'react-router'

const TABS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/food', label: 'Food', icon: '🍎' },
  { to: '/meals', label: 'Meals', icon: '📖' },
  { to: '/workouts', label: 'Workouts', icon: '🏋️' },
  { to: '/recipes', label: 'Recipes', icon: '📋' },
] as const

/** Tab taps replace history instead of pushing, so switching tabs doesn't
 * pile up back-stack entries — see DECISIONS.md. */
export function BottomTabBar() {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          replace
          className={({ isActive }) => `tab-bar-item${isActive ? ' tab-bar-item--active' : ''}`}
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
