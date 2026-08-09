import { Navigate, Route, Routes } from 'react-router'
import { DashboardPage } from '../pages/DashboardPage'
import { FoodEditPage } from '../pages/FoodEditPage'
import { FoodListPage } from '../pages/FoodListPage'
import { MealEditPage } from '../pages/MealEditPage'
import { MealListPage } from '../pages/MealListPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { RecipesPage } from '../pages/RecipesPage'
import { WorkoutsPage } from '../pages/WorkoutsPage'
import { TabShell } from './TabShell'

interface AppRoutesProps {
  hasProfile: boolean
  onOnboardingComplete: () => void
}

/** hasProfile gates every non-onboarding route. It must flip the moment
 * onboarding finishes (via onOnboardingComplete), not just get re-checked
 * on the next cold boot — otherwise a just-completed onboarding still
 * renders against the "no profile" route tree and bounces straight back. */
export function AppRoutes({ hasProfile, onOnboardingComplete }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage onComplete={onOnboardingComplete} />} />
      {hasProfile ? (
        <Route element={<TabShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/food" element={<FoodListPage />} />
          <Route path="/food/new" element={<FoodEditPage />} />
          <Route path="/food/:id" element={<FoodEditPage />} />
          <Route path="/meals" element={<MealListPage />} />
          <Route path="/meals/new" element={<MealEditPage />} />
          <Route path="/meals/:id" element={<MealEditPage />} />
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
