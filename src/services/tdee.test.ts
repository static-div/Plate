import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { upsertBodyLog } from './bodyLog'
import { createDiaryEntry } from './diaryEntry'
import { createFood } from './food'
import { createProfile } from './profile'
import { getActiveTdee } from './tdee'

let driver: SqlDriver
let userId: string

beforeEach(async () => {
  driver = await setupTestDb()
  userId = await createTestUser(driver)
})

afterEach(async () => {
  await teardownTestDb(driver)
})

describe('getActiveTdee', () => {
  it('returns null with no profile', async () => {
    expect(await getActiveTdee(userId)).toBeNull()
  })

  it('returns null with a profile but no weight ever logged', async () => {
    await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    expect(await getActiveTdee(userId)).toBeNull()
  })

  it('falls back to the formula anchor when there is not enough data for an observed TDEE', async () => {
    await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    await upsertBodyLog(userId, { date: '2026-08-09', weight_kg: 80 })

    const result = await getActiveTdee(userId)
    expect(result?.observed.status).toBe('insufficient_data')
    // Hand-verified (see TDEE_CALCULATIONS.md): 10*80+6.25*180-5*30+5=1780, *1.2=2136
    expect(result?.formula.anchorTdee).toBeCloseTo(2136, 6)
    expect(result?.activeTdee).toBeCloseTo(2136, 6)
  })

  it('uses the observed TDEE once a valid 28-day window exists', async () => {
    await createProfile(userId, { height_cm: 180, age: 30, sex: 'male' })
    const food = await createFood(userId, {
      name: 'Chicken breast',
      serving_size: 100,
      serving_unit: 'g',
      calories: 165,
      protein_g: 31,
      carbs_g: 0,
      fat_g: 3.6,
    })

    // Same happy-path dataset as observedTdee.test.ts: start group days
    // 1-7, end group days 22-28, 14 of 28 days with calories logged.
    const weightDates = ['01', '02', '04', '06', '07', '22', '24', '26', '28']
    const weights = [80.0, 79.9, 79.8, 79.7, 79.6, 79.0, 78.9, 78.8, 78.7]
    for (let i = 0; i < weightDates.length; i++) {
      await upsertBodyLog(userId, { date: `2026-01-${weightDates[i]}`, weight_kg: weights[i] })
    }

    const calorieDates = ['01', '02', '04', '06', '07', '10', '12', '14', '16', '18', '22', '24', '26', '28']
    for (const date of calorieDates) {
      // 100g of the 165 kcal/100g food = 165 kcal logged that day.
      await createDiaryEntry(userId, {
        date: `2026-01-${date}`,
        source_type: 'food',
        source_id: food.id,
        quantity: 100,
        quantity_unit: 'g',
      })
    }

    const result = await getActiveTdee(userId)
    const { observed } = result ?? {}
    if (observed?.status !== 'ok') throw new Error('expected an ok observed result')

    // All 14 logged days are 165 kcal, so avgLoggedCalories is exactly 165.
    expect(observed.avgLoggedCalories).toBeCloseTo(165, 6)
    // activeTdee prefers the observed value once it's available (invariant:
    // observed supersedes the formula estimate, per the original TDEE spec).
    expect(result?.activeTdee).toBeCloseTo(observed.observedTdee, 6)
  })
})
