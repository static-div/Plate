import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SqlDriver } from './db/driver'
import { createTestUser, setupTestDb, teardownTestDb } from './db/testing/setupTestDb'
import { createFood, deleteFood, updateFood } from './food'
import { createMeal } from './meal'
import {
  createMealIngredient,
  getMealIngredient,
  updateMealIngredient,
} from './mealIngredient'

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

describe('meal_ingredient snapshot integrity', () => {
  it('scales macros to the logged quantity at creation', async () => {
    const food = await createFood(userId, chickenPer100g)
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 2 })

    const ingredient = await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    // Hand-verified: 150/100 = 1.5x the per-100g macros.
    expect(ingredient.s_calories).toBeCloseTo(247.5)
    expect(ingredient.s_protein_g).toBeCloseTo(46.5)
    expect(ingredient.s_fat_g).toBeCloseTo(5.4)
    expect(ingredient.s_name).toBe('Chicken breast')
  })

  it('is unchanged after the source food is edited', async () => {
    const food = await createFood(userId, chickenPer100g)
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 2 })
    const ingredient = await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    await updateFood(userId, food.id, { calories: 999, protein_g: 999 })

    const unchanged = await getMealIngredient(userId, ingredient.id)
    expect(unchanged?.s_calories).toBeCloseTo(247.5)
    expect(unchanged?.s_protein_g).toBeCloseTo(46.5)
  })

  it('is unchanged after the source food is deleted', async () => {
    const food = await createFood(userId, chickenPer100g)
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 2 })
    const ingredient = await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    await deleteFood(userId, food.id)

    const unchanged = await getMealIngredient(userId, ingredient.id)
    expect(unchanged?.s_calories).toBeCloseTo(247.5)
    expect(unchanged?.s_name).toBe('Chicken breast')
  })

  it('rejects a quantity_unit that does not match the food serving_unit', async () => {
    const food = await createFood(userId, chickenPer100g)
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 2 })

    await expect(
      createMealIngredient(userId, {
        meal_id: meal.id,
        food_id: food.id,
        quantity: 150,
        quantity_unit: 'ml',
      }),
    ).rejects.toThrow(/quantity_unit/)
  })

  it('updating quantity re-derives the snapshot from the current active food', async () => {
    const food = await createFood(userId, chickenPer100g)
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 2 })
    const ingredient = await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    await updateFood(userId, food.id, { calories: 200 })
    const updated = await updateMealIngredient(userId, ingredient.id, { quantity: 200 })

    // Hand-verified: 200/100 = 2x the *edited* per-100g calories.
    expect(updated.s_calories).toBeCloseTo(400)
  })

  it('refuses to update once the source food has been deleted', async () => {
    const food = await createFood(userId, chickenPer100g)
    const meal = await createMeal(userId, { name: 'Chicken rice bowl', total_portions: 2 })
    const ingredient = await createMealIngredient(userId, {
      meal_id: meal.id,
      food_id: food.id,
      quantity: 150,
      quantity_unit: 'g',
    })

    await deleteFood(userId, food.id)

    await expect(updateMealIngredient(userId, ingredient.id, { quantity: 200 })).rejects.toThrow()
  })
})
