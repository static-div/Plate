import { computeObservedTdee, type ObservedTdeeResult } from '../lib/calculations/observedTdee'
import { selectFormulaTdee, type FormulaTdeeResult } from '../lib/calculations/formulaTdee'
import { listBodyLogs } from './bodyLog'
import { listDailyCalorieTotals } from './diaryEntry'
import { getProfile } from './profile'

export interface ActiveTdee {
  formula: FormulaTdeeResult
  observed: ObservedTdeeResult
  /** The number to show as "your TDEE": observed once available, else the formula anchor. */
  activeTdee: number
}

function subtractDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/**
 * Orchestrates profile + body_log + diary_entry into the pure TDEE
 * calculations. Not itself pure (reads storage) and not itself a
 * calculation (does no math) — it's the seam between the two.
 * Returns null if there's no profile or no weight ever logged, since
 * neither formula can run without a current weight.
 */
export async function getActiveTdee(userId: string): Promise<ActiveTdee | null> {
  const profile = await getProfile(userId)
  if (!profile) return null

  const bodyLogs = await listBodyLogs(userId) // ascending by date
  const latestWeightEntry = bodyLogs[bodyLogs.length - 1]
  if (!latestWeightEntry) return null

  const latestBodyFatEntry = [...bodyLogs].reverse().find((b) => b.body_fat_percent != null)

  const formula = selectFormulaTdee({
    profile: {
      weightKg: latestWeightEntry.weight_kg,
      heightCm: profile.height_cm,
      age: profile.age,
      sex: profile.sex,
    },
    latestBodyFat: latestBodyFatEntry
      ? { percent: latestBodyFatEntry.body_fat_percent!, method: latestBodyFatEntry.body_fat_method! }
      : undefined,
  })

  const windowEnd = latestWeightEntry.date
  const windowStart = subtractDays(windowEnd, 27)
  const weightEntries = bodyLogs.map((b) => ({ date: b.date, weightKg: b.weight_kg }))
  const calorieEntries = await listDailyCalorieTotals(userId, windowStart, windowEnd)
  const observed = computeObservedTdee(weightEntries, calorieEntries)

  return {
    formula,
    observed,
    activeTdee: observed.status === 'ok' ? observed.observedTdee : formula.anchorTdee,
  }
}
