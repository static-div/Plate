import { describe, expect, it } from 'vitest'
import { katchMcArdleBmr, mifflinStJeorBmr, tdeeSedentary } from './bmr'

describe('mifflinStJeorBmr', () => {
  it('computes BMR for a male', () => {
    // Hand-verified: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmr = mifflinStJeorBmr({ weightKg: 80, heightCm: 180, age: 30, sex: 'male' })
    expect(bmr).toBeCloseTo(1780, 6)
    expect(tdeeSedentary(bmr)).toBeCloseTo(2136, 6)
  })

  it('computes BMR for a female', () => {
    // Hand-verified: 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
    const bmr = mifflinStJeorBmr({ weightKg: 65, heightCm: 165, age: 28, sex: 'female' })
    expect(bmr).toBeCloseTo(1380.25, 6)
    expect(tdeeSedentary(bmr)).toBeCloseTo(1656.3, 6)
  })
})

describe('katchMcArdleBmr', () => {
  it('computes BMR from lean body mass', () => {
    // Hand-verified: LBM = 80*0.8 = 64; BMR = 370 + 21.6*64 = 370 + 1382.4 = 1752.4
    const bmr = katchMcArdleBmr({ weightKg: 80, bodyFatPercent: 20 })
    expect(bmr).toBeCloseTo(1752.4, 6)
    expect(tdeeSedentary(bmr)).toBeCloseTo(2102.88, 6)
  })
})
