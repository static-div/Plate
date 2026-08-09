import { katchMcArdleBmr, mifflinStJeorBmr, tdeeSedentary, type MifflinStJeorInput } from './bmr'

export type BodyFatMethod = 'visual_estimate' | 'navy_tape' | 'dexa' | 'bioimpedance'

export interface FormulaTdeeInput {
  profile: MifflinStJeorInput
  /** The most recent body_log entry with a body_fat_percent, if any. */
  latestBodyFat?: { percent: number; method: BodyFatMethod }
}

export interface FormulaTdeeResult {
  anchorTdee: number
  mifflinTdee: number
  katchTdee: number | null
  secondary: { tdee: number; label: string } | null
}

/**
 * Spec step 3 (anchor selection):
 * - no body-fat entry -> Mifflin-St Jeor only
 * - visual_estimate -> anchor = Mifflin; Katch shown as an unmeasured secondary
 * - measured (navy_tape/dexa/bioimpedance) -> anchor = average of both
 */
export function selectFormulaTdee(input: FormulaTdeeInput): FormulaTdeeResult {
  const mifflinTdee = tdeeSedentary(mifflinStJeorBmr(input.profile))

  if (!input.latestBodyFat) {
    return { anchorTdee: mifflinTdee, mifflinTdee, katchTdee: null, secondary: null }
  }

  const katchTdee = tdeeSedentary(
    katchMcArdleBmr({ weightKg: input.profile.weightKg, bodyFatPercent: input.latestBodyFat.percent }),
  )

  if (input.latestBodyFat.method === 'visual_estimate') {
    return {
      anchorTdee: mifflinTdee,
      mifflinTdee,
      katchTdee,
      secondary: { tdee: katchTdee, label: 'based on an unmeasured estimate' },
    }
  }

  return {
    anchorTdee: (mifflinTdee + katchTdee) / 2,
    mifflinTdee,
    katchTdee,
    secondary: null,
  }
}
