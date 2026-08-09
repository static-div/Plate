export interface MifflinStJeorInput {
  weightKg: number
  heightCm: number
  age: number
  sex: 'male' | 'female'
}

export function mifflinStJeorBmr(input: MifflinStJeorInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age
  return input.sex === 'male' ? base + 5 : base - 161
}

export interface KatchMcArdleInput {
  weightKg: number
  bodyFatPercent: number
}

export function katchMcArdleBmr(input: KatchMcArdleInput): number {
  const leanMassKg = input.weightKg * (1 - input.bodyFatPercent / 100)
  return 370 + 21.6 * leanMassKg
}

/** Fixed at sedentary for every calculation in this module — see DECISIONS.md. */
export const SEDENTARY_MULTIPLIER = 1.2

export function tdeeSedentary(bmr: number): number {
  return bmr * SEDENTARY_MULTIPLIER
}
