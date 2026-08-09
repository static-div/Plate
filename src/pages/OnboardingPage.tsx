import { useNavigate } from 'react-router'
import { todayLocal } from '../app/todayLocal'
import { ProfileForm, type ProfileFormResult } from '../components/profile/ProfileForm'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import { upsertBodyLog } from '../services/bodyLog'
import { createProfile } from '../services/profile'

export function OnboardingPage() {
  const userId = useCurrentUserId()
  const navigate = useNavigate()

  async function handleSubmit(values: ProfileFormResult) {
    await createProfile(userId, { height_cm: values.heightCm, age: values.age, sex: values.sex })
    await upsertBodyLog(userId, {
      date: todayLocal(),
      weight_kg: values.weightKg,
      body_fat_percent: values.bodyFat?.percent ?? null,
      body_fat_method: values.bodyFat?.method ?? null,
    })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="page">
      <div className="stack">
        <h1 className="heading">Welcome to Plate</h1>
        <p className="text-muted">Let's set up your profile.</p>
        <ProfileForm onSubmit={handleSubmit} submitLabel="Get started" />
      </div>
    </div>
  )
}
