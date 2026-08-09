import { describe, expect, it } from 'vitest'
import { selectFormulaTdee } from './formulaTdee'

const maleProfile = { weightKg: 80, heightCm: 180, age: 30, sex: 'male' as const }

describe('selectFormulaTdee', () => {
  it('anchors on Mifflin-St Jeor alone when there is no body-fat entry', () => {
    const result = selectFormulaTdee({ profile: maleProfile })
    // Hand-verified: BMR=1780, TDEE=2136 (see bmr.test.ts)
    expect(result.anchorTdee).toBeCloseTo(2136, 6)
    expect(result.mifflinTdee).toBeCloseTo(2136, 6)
    expect(result.katchTdee).toBeNull()
    expect(result.secondary).toBeNull()
  })

  it('anchors on Mifflin and shows Katch as a labeled secondary for a visual estimate', () => {
    const result = selectFormulaTdee({
      profile: maleProfile,
      latestBodyFat: { percent: 20, method: 'visual_estimate' },
    })
    // Hand-verified: Mifflin TDEE=2136, Katch TDEE=2102.88 (see bmr.test.ts)
    expect(result.anchorTdee).toBeCloseTo(2136, 6)
    expect(result.katchTdee).toBeCloseTo(2102.88, 6)
    expect(result.secondary).toEqual({ tdee: result.katchTdee, label: 'based on an unmeasured estimate' })
  })

  it('anchors on the average of Mifflin and Katch for a measured body-fat method', () => {
    const result = selectFormulaTdee({
      profile: maleProfile,
      latestBodyFat: { percent: 20, method: 'navy_tape' },
    })
    // Hand-verified: (2136 + 2102.88) / 2 = 2119.44
    expect(result.anchorTdee).toBeCloseTo(2119.44, 6)
    expect(result.secondary).toBeNull()
  })

  it('treats dexa and bioimpedance the same as navy_tape (all "measured")', () => {
    const dexa = selectFormulaTdee({ profile: maleProfile, latestBodyFat: { percent: 20, method: 'dexa' } })
    const bioimpedance = selectFormulaTdee({
      profile: maleProfile,
      latestBodyFat: { percent: 20, method: 'bioimpedance' },
    })
    expect(dexa.anchorTdee).toBeCloseTo(2119.44, 6)
    expect(bioimpedance.anchorTdee).toBeCloseTo(2119.44, 6)
  })
})
