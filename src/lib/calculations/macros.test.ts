import { describe, expect, it } from 'vitest'
import { scaleMacros, sumMacros, type Macros } from './macros'

const chickenPer100g: Macros = { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 }

describe('scaleMacros', () => {
  it('scales per-serving macros to a logged quantity', () => {
    // 150g of a food defined per 100g: hand-verified 1.5x each value.
    expect(scaleMacros(chickenPer100g, 150, 100)).toEqual({
      calories: 247.5,
      protein_g: 46.5,
      carbs_g: 0,
      fat_g: 5.4,
    })
  })

  it('scales a meal total to a portion count', () => {
    const mealTotal: Macros = { calories: 800, protein_g: 80, carbs_g: 40, fat_g: 20 }
    // 2 of 4 portions: hand-verified half of the total.
    expect(scaleMacros(mealTotal, 2, 4)).toEqual({
      calories: 400,
      protein_g: 40,
      carbs_g: 20,
      fat_g: 10,
    })
  })

  it('logging an amount directly equals logging it as a single-ingredient, single-portion meal', () => {
    const direct = scaleMacros(chickenPer100g, 150, 100)
    const ingredientSnapshot = scaleMacros(chickenPer100g, 150, 100)
    const mealTotal = sumMacros([ingredientSnapshot])
    const viaMeal = scaleMacros(mealTotal, 1, 1)
    expect(viaMeal).toEqual(direct)
  })
})

describe('sumMacros', () => {
  it('adds macros across ingredients', () => {
    const a: Macros = { calories: 100, protein_g: 10, carbs_g: 5, fat_g: 2 }
    const b: Macros = { calories: 50, protein_g: 5, carbs_g: 2, fat_g: 1 }
    // Hand-verified: componentwise sum.
    expect(sumMacros([a, b])).toEqual({ calories: 150, protein_g: 15, carbs_g: 7, fat_g: 3 })
  })

  it('returns all zeros for an empty list', () => {
    expect(sumMacros([])).toEqual({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
  })
})
