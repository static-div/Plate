import { describe, expect, it } from 'vitest'
import { roundTo } from './roundTo'

describe('roundTo', () => {
  it('rounds to the given number of decimals', () => {
    expect(roundTo(1.2345, 2)).toBe(1.23)
  })

  it('rounds to a whole number when decimals is 0', () => {
    expect(roundTo(4.6, 0)).toBe(5)
  })
})
