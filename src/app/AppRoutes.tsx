import { Navigate, Route, Routes } from 'react-router'
import { DashboardPage } from '../pages/DashboardPage'
import { FoodEditPage } from '../pages/FoodEditPage'
import { FoodListPage } from '../pages/FoodListPage'
import { MealsPage } from '../pages/MealsPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { RecipesPage } from '../pages/RecipesPage'
import { WorkoutsPage } from '../pages/WorkoutsPage'
import { TabShell } from './TabShell'

/** Onboarding is reachable regardless of profile state (so a resubmit can't
 * get stuck); every other route requires a profile, or redirects to it. */
export function AppRoutes({ hasProfile }: { hasProfile: boolean }) {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      {hasProfile ? (
        <Route element={<TabShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/food" element={<FoodListPage />} />
          <Route path="/food/new" element={<FoodEditPage />} />
          <Route path="/food/:id" element={<FoodEditPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      )}
    </Routes>
  )
}
