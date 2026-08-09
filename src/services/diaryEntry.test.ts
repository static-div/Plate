import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { createFood, deleteFood, updateFood } from './food'
import { createMeal } from './meal'
import { createMealIngredient } from './mealIngredient'
import { createDiaryEntry, getDiaryEntry, listDailyCalorieTotals, listDiaryEntriesByDate } from './diaryEntry'

let driver: SqlDriver
let userId: string

beforeEach(async () => {
  driver = await setupTestDb()
  userId = await createTestUser(driver)
})

afterEach(async () => {
  await teardownTestDb(driver)
})

const chickenPer100g = {
  name: 'Chicken breast',
  serving_size: 100,
  serving_unit: 'g',
  calories: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
}

describe('diary_entry, source_type=food', () => {
  it('scales macros to the logged quantity at creation', async () => {
    const food = await createFood(userId, chickenPer100g)
    const entry = await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'food',
      source_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    // Hand-verified: 150/100 = 1.5x.
    expect(entry.s_calories).toBeCloseTo(247.5)
    expect(entry.s_protein_g).toBeCloseTo(46.5)
  })

  it('is unchanged after the source food is edited', async () => {
    const food = await createFood(userId, chickenPer100g)
    const entry = await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'food',
      source_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    await updateFood(userId, food.id, { calories: 999 })

    const unchanged = await getDiaryEntry(userId, entry.id)
    expect(unchanged?.s_calories).toBeCloseTo(247.5)
  })

  it('is unchanged after the source food is deleted, and stays listable for its date', async () => {
    const food = await createFood(userId, chickenPer100g)
    const entry = await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'food',
      source_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    await deleteFood(userId, food.id)

    const unchanged = await getDiaryEntry(userId, entry.id)
    expect(unchanged?.s_calories).toBeCloseTo(247.5)

    const forDate = await listDiaryEntriesByDate(userId, '2026-08-09')
    expect(forDate.map((e) => e.id)).toContain(entry.id)
  })
})

describe('diary_entry, source_type=meal', () => {
  it('scales the summed ingredient total to the logged portion count', async () => {
    const chicken = await createFood(userId, chickenPer100g)
    const rice = await createFood(userId, {
      name: 'Rice',
      serving_size: 100,
      serving_unit: 'g',
      calories: 130,
      protein_g: 2.4,
      carbs_g: 28,
      fat_g: 0.3,
    })
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 4 })
    await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: chicken.id,
      quantity: 300,
      quantity_unit: 'g',
    })
    await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: rice.id,
      quantity: 200,
      quantity_unit: 'g',
    })
    // Ingredient totals, hand-verified: chicken 300/100*165=495 cal, rice 200/100*130=260 cal -> 755 total.
    // 1 of 4 portions = 755/4 = 188.75.
    const entry = await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'meal',
      source_id: meal.id,
      quantity: 1,
      quantity_unit: 'portion',
    })

    expect(entry.s_calories).toBeCloseTo(188.75)
    expect(entry.s_name).toBe('Chicken rice bowl')
  })
})

describe('cross-source equivalence', () => {
  it('logging an amount directly equals logging it via a single-ingredient, single-portion meal', async () => {
    const food = await createFood(userId, chickenPer100g)

    const direct = await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'food',
      source_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    const meal = await createMeal(userId, { name: 'Just chicken', total_portions: 1 })
    await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })
    const viaMeal = await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'meal',
      source_id: meal.id,
      quantity: 1,
      quantity_unit: 'portion',
    })

    expect(viaMeal.s_calories).toBeCloseTo(direct.s_calories)
    expect(viaMeal.s_protein_g).toBeCloseTo(direct.s_protein_g)
    expect(viaMeal.s_carbs_g).toBeCloseTo(direct.s_carbs_g)
    expect(viaMeal.s_fat_g).toBeCloseTo(direct.s_fat_g)
  })
})

describe('validation', () => {
  it('rejects a food-sourced quantity_unit that does not match the food', async () => {
    const food = await createFood(userId, chickenPer100g)
    await expect(
      createDiaryEntry(userId, {
        date: '2026-08-09',
        source_type: 'food',
        source_id: food.id,
        quantity: 150,
        quantity_unit: 'ml',
      }),
    ).rejects.toThrow(/quantity_unit/)
  })

  it('rejects a meal-sourced entry whose quantity_unit is not "portion"', async () => {
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 4 })
    await expect(
      createDiaryEntry(userId, {
        date: '2026-08-09',
        source_type: 'meal',
        source_id: meal.id,
        quantity: 1,
        quantity_unit: 'g',
      }),
    ).rejects.toThrow(/portion/)
  })
})

describe('listDailyCalorieTotals', () => {
  it('sums same-day entries and omits days with none, never zero-filling', async () => {
    const food = await createFood(userId, chickenPer100g)
    // 150g + 50g on the 9th: 165*1.5 + 165*0.5 = 247.5 + 82.5 = 330
    await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'food',
      source_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })
    await createDiaryEntry(userId, {
      date: '2026-08-09',
      source_type: 'food',
      source_id: food.id,
      quantity: 50,
      quantity_unit: 'g',
    })
    // Nothing logged on the 10th (a gap). 100g on the 11th: 165.
    await createDiaryEntry(userId, {
      date: '2026-08-11',
      source_type: 'food',
      source_id: food.id,
      quantity: 100,
      quantity_unit: 'g',
    })

    const totals = await listDailyCalorieTotals(userId, '2026-08-09', '2026-08-11')
    expect(totals).toEqual([
      { date: '2026-08-09', calories: 330 },
      { date: '2026-08-11', calories: 165 },
    ])
  })
})
