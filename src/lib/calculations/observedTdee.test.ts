import { describe, expect, it } from 'vitest'
import { computeObservedTdee, type DailyCalorieEntry, type DailyWeightEntry } from './observedTdee'

// Window = Jan 1-28, 2026 (day 1 = Jan 1, day 28 = Jan 28, the most recent
// weight entry). Start group (days 1-7): 5 entries, gaps on Jan 3/5. End
// group (days 22-28): 4 entries (the minimum), gaps on Jan 23/25/27.
const happyPathWeights: DailyWeightEntry[] = [
  { date: '2026-01-01', weightKg: 80.0 },
  { date: '2026-01-02', weightKg: 79.9 },
  { date: '2026-01-04', weightKg: 79.8 },
  { date: '2026-01-06', weightKg: 79.7 },
  { date: '2026-01-07', weightKg: 79.6 },
  { date: '2026-01-22', weightKg: 79.0 },
  { date: '2026-01-24', weightKg: 78.9 },
  { date: '2026-01-26', weightKg: 78.8 },
  { date: '2026-01-28', weightKg: 78.7 },
]

// 14 of the 28 window days logged: the start/end group dates plus 5 more in
// the middle. Exactly the 50% coverage floor.
const happyPathCalories: DailyCalorieEntry[] = [
  { date: '2026-01-01', calories: 2100 },
  { date: '2026-01-02', calories: 2050 },
  { date: '2026-01-04', calories: 2000 },
  { date: '2026-01-06', calories: 1950 },
  { date: '2026-01-07', calories: 1900 },
  { date: '2026-01-10', calories: 2200 },
  { date: '2026-01-12', calories: 2150 },
  { date: '2026-01-14', calories: 2100 },
  { date: '2026-01-16', calories: 2050 },
  { date: '2026-01-18', calories: 2000 },
  { date: '2026-01-22', calories: 1900 },
  { date: '2026-01-24', calories: 1850 },
  { date: '2026-01-26', calories: 1800 },
  { date: '2026-01-28', calories: 1750 },
]

function expectHappyPathResult(result: ReturnType<typeof computeObservedTdee>) {
  if (result.status !== 'ok') throw new Error(`expected ok, got insufficient_data: ${result.reason}`)
  // Hand-verified (see conversation record / TDEE_CALCULATIONS.md):
  // startAvg=399.0/5=79.8, endAvg=315.4/4=78.85, startMidpoint=20/5=4,
  // endMidpoint=100/4=25, days=21, dailyEnergyBalance=-7315/21=-348.333333,
  // avgLoggedCalories=27800/14=1985.714286, observedTDEE=49015/21=2334.047619
  expect(result.startAvgWeightKg).toBeCloseTo(79.8, 6)
  expect(result.endAvgWeightKg).toBeCloseTo(78.85, 6)
  expect(result.days).toBeCloseTo(21, 6)
  expect(result.dailyEnergyBalanceKcal).toBeCloseTo(-348.333333, 5)
  expect(result.avgLoggedCalories).toBeCloseTo(1985.714286, 5)
  expect(result.observedTdee).toBeCloseTo(2334.047619, 5)
}

describe('computeObservedTdee: happy path', () => {
  it('computes observed TDEE from a valid 28-day window', () => {
    expectHappyPathResult(computeObservedTdee(happyPathWeights, happyPathCalories))
  })
})

describe('computeObservedTdee: edge cases', () => {
  it('returns insufficient_data with no weight entries at all', () => {
    const result = computeObservedTdee([], [])
    expect(result.status).toBe('insufficient_data')
  })

  it('returns insufficient_data when the start group has fewer than 4 entries', () => {
    const sparseStart = happyPathWeights.filter((w) => !['2026-01-06', '2026-01-07'].includes(w.date))
    const result = computeObservedTdee(sparseStart, happyPathCalories)
    expect(result.status).toBe('insufficient_data')
  })

  it('returns insufficient_data when calorie coverage is under 50%', () => {
    // Only 10 of the 28 window days have a calorie entry (~35.7%).
    const sparseCalories = happyPathCalories.filter((c) =>
      ['2026-01-01', '2026-01-02', '2026-01-04', '2026-01-06', '2026-01-07', '2026-01-22', '2026-01-24', '2026-01-26', '2026-01-28', '2026-01-15'].includes(
        c.date,
      ),
    )
    const result = computeObservedTdee(happyPathWeights, sparseCalories)
    expect(result.status).toBe('insufficient_data')
  })

  it('ignores entries older than the 28-day window (max lookback)', () => {
    const withStaleEntries: DailyWeightEntry[] = [
      { date: '2025-12-15', weightKg: 999.0 }, // ~48 days before the window start
      ...happyPathWeights,
    ]
    const staleCalories: DailyCalorieEntry[] = [
      { date: '2025-12-20', calories: 5000 },
      ...happyPathCalories,
    ]
    expectHappyPathResult(computeObservedTdee(withStaleEntries, staleCalories))
  })

  it('overwrites a duplicate date instead of accumulating it', () => {
    const withDuplicate: DailyWeightEntry[] = [
      { date: '2026-01-01', weightKg: 999.0 }, // stale, appears before the real entry
      ...happyPathWeights,
    ]
    // If this were treated as two separate entries, the start group would
    // have 6 members and a different average; if the first (stale) value
    // won instead of the last, startAvgWeightKg would be far from 79.8.
    expectHappyPathResult(computeObservedTdee(withDuplicate, happyPathCalories))
  })
})
