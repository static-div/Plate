export interface DailyWeightEntry {
  date: string // 'YYYY-MM-DD'
  weightKg: number
}

export interface DailyCalorieEntry {
  date: string // 'YYYY-MM-DD', already summed from that day's diary_entry snapshots
  calories: number
}

export type ObservedTdeeResult =
  | { status: 'insufficient_data'; reason: string }
  | {
      status: 'ok'
      observedTdee: number
      dailyEnergyBalanceKcal: number
      avgLoggedCalories: number
      startAvgWeightKg: number
      endAvgWeightKg: number
      days: number
    }

const WINDOW_DAYS = 28
const START_GROUP = [1, 7] as const
const END_GROUP = [22, 28] as const
const MIN_GROUP_ENTRIES = 4
const MIN_CALORIE_COVERAGE = 0.5
const KCAL_PER_KG = 7700

function toEpochDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

/** Last occurrence wins — duplicate dates overwrite, never accumulate. */
function dedupeByDate<T extends { date: string }>(entries: T[]): T[] {
  const byDate = new Map<string, T>()
  for (const entry of entries) byDate.set(entry.date, entry)
  return [...byDate.values()]
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function inRange(dayNumber: number, [min, max]: readonly [number, number]): boolean {
  return dayNumber >= min && dayNumber <= max
}

/**
 * Empirical TDEE from a trailing 28-day window anchored at the most recent
 * weight entry. Entries outside the window are ignored entirely; entries
 * within it are never interpolated or zero-filled for missing days.
 */
export function computeObservedTdee(
  weightEntries: DailyWeightEntry[],
  calorieEntries: DailyCalorieEntry[],
): ObservedTdeeResult {
  const weights = dedupeByDate(weightEntries)
  if (weights.length === 0) {
    return { status: 'insufficient_data', reason: 'no weight entries logged yet' }
  }

  const windowEndEpochDay = Math.max(...weights.map((w) => toEpochDay(w.date)))
  const windowStartEpochDay = windowEndEpochDay - (WINDOW_DAYS - 1)
  const dayNumberOf = (date: string) => toEpochDay(date) - windowStartEpochDay + 1

  const weightsInWindow = weights
    .map((w) => ({ ...w, dayNumber: dayNumberOf(w.date) }))
    .filter((w) => inRange(w.dayNumber, [1, WINDOW_DAYS]))

  const startGroup = weightsInWindow.filter((w) => inRange(w.dayNumber, START_GROUP))
  const endGroup = weightsInWindow.filter((w) => inRange(w.dayNumber, END_GROUP))

  if (startGroup.length < MIN_GROUP_ENTRIES || endGroup.length < MIN_GROUP_ENTRIES) {
    return {
      status: 'insufficient_data',
      reason: `not enough weight data in the trailing ${WINDOW_DAYS}-day window (need at least ${MIN_GROUP_ENTRIES} entries in days ${START_GROUP[0]}-${START_GROUP[1]} and ${MIN_GROUP_ENTRIES} in days ${END_GROUP[0]}-${END_GROUP[1]})`,
    }
  }

  const startAvgWeightKg = mean(startGroup.map((w) => w.weightKg))
  const endAvgWeightKg = mean(endGroup.map((w) => w.weightKg))
  const days = mean(endGroup.map((w) => w.dayNumber)) - mean(startGroup.map((w) => w.dayNumber))

  const caloriesInWindow = dedupeByDate(calorieEntries).filter((c) =>
    inRange(dayNumberOf(c.date), [1, WINDOW_DAYS]),
  )
  const coverage = caloriesInWindow.length / WINDOW_DAYS
  if (coverage < MIN_CALORIE_COVERAGE) {
    return {
      status: 'insufficient_data',
      reason: `not enough logged calories in the trailing ${WINDOW_DAYS}-day window (need at least ${MIN_CALORIE_COVERAGE * 100}% day coverage)`,
    }
  }

  const avgLoggedCalories = mean(caloriesInWindow.map((c) => c.calories))
  const dailyEnergyBalanceKcal = ((endAvgWeightKg - startAvgWeightKg) * KCAL_PER_KG) / days
  const observedTdee = avgLoggedCalories - dailyEnergyBalanceKcal

  return {
    status: 'ok',
    observedTdee,
    dailyEnergyBalanceKcal,
    avgLoggedCalories,
    startAvgWeightKg,
    endAvgWeightKg,
    days,
  }
}
