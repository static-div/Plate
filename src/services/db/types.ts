import type { Macros } from '../../lib/calculations/macros'

interface Timestamped {
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProfileRow extends Timestamped {
  id: string
  user_id: string
  height_cm: number
  age: number
  sex: 'male' | 'female'
}

export interface FoodRow extends Timestamped {
  id: string
  user_id: string
  code: string | null
  name: string
  brand: string | null
  serving_size: number
  serving_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  source: 'manual' | 'openfoodfacts'
}

export interface MealRow extends Timestamped {
  id: string
  user_id: string
  name: string
  total_portions: number
  method: string | null
  photo_path: string | null
}

interface SnapshotColumns {
  s_name: string
  s_calories: number
  s_protein_g: number
  s_carbs_g: number
  s_fat_g: number
}

export interface MealIngredientRow extends Timestamped, SnapshotColumns {
  id: string
  user_id: string
  meal_id: string
  food_id: string | null
  quantity: number
  quantity_unit: string
}

export interface DiaryEntryRow extends Timestamped, SnapshotColumns {
  id: string
  user_id: string
  date: string
  source_type: 'food' | 'meal'
  source_id: string | null
  quantity: number
  quantity_unit: string
}

export interface BodyLogRow extends Timestamped {
  id: string
  user_id: string
  date: string
  weight_kg: number
  body_fat_percent: number | null
  body_fat_method: 'visual_estimate' | 'navy_tape' | 'dexa' | 'bioimpedance' | null
  notes: string | null
}

/** food's unprefixed macro columns -> the generic Macros shape pure calculations use. */
export function foodMacros(food: FoodRow): Macros {
  return { calories: food.calories, protein_g: food.protein_g, carbs_g: food.carbs_g, fat_g: food.fat_g }
}

/** A snapshot row's s_* columns -> the generic Macros shape. */
export function snapshotMacros(row: SnapshotColumns): Macros {
  return {
    calories: row.s_calories,
    protein_g: row.s_protein_g,
    carbs_g: row.s_carbs_g,
    fat_g: row.s_fat_g,
  }
}

/** The generic Macros shape -> s_* columns ready to insert. */
export function macrosToSnapshotColumns(m: Macros): Omit<SnapshotColumns, 's_name'> {
  return { s_calories: m.calories, s_protein_g: m.protein_g, s_carbs_g: m.carbs_g, s_fat_g: m.fat_g }
}
