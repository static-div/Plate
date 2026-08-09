export interface Macros {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

/**
 * The single scaling rule for the whole app: a food's macros scaled to a
 * logged/used quantity, given the base quantity they're defined against.
 * base = food.serving_size for a food-derived amount, or meal.total_portions
 * for a portion of a summed meal total. Logging the same real-world amount
 * directly or via a recipe must produce identical numbers.
 */
export function scaleMacros(macros: Macros, quantity: number, base: number): Macros {
  const factor = quantity / base
  return {
    calories: macros.calories * factor,
    protein_g: macros.protein_g * factor,
    carbs_g: macros.carbs_g * factor,
    fat_g: macros.fat_g * factor,
  }
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (total, m) => ({
      calories: total.calories + m.calories,
      protein_g: total.protein_g + m.protein_g,
      carbs_g: total.carbs_g + m.carbs_g,
      fat_g: total.fat_g + m.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
}
