import { describe, expect, it } from 'vitest'
import { Rng } from './rng'
import { hhmm } from './time'

describe('Rng', () => {
  it('same seed gives the same sequence', () => {
    const a = new Rng(42), b = new Rng(42)
    const sa = Array.from({ length: 5 }, () => a.next())
    const sb = Array.from({ length: 5 }, () => b.next())
    expect(sa).toEqual(sb)
  })
  it('different seeds give different sequences', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next())
  })
  it('range stays inside [a, b)', () => {
    const r = new Rng(7)
    for (let i = 0; i < 1000; i++) {
      const v = r.range(2, 3)
      expect(v).toBeGreaterThanOrEqual(2)
      expect(v).toBeLessThan(3)
    }
  })
  it('pick returns an element of the array', () => {
    const r = new Rng(3), arr = ['a', 'b', 'c']
    for (let i = 0; i < 50; i++) expect(arr).toContain(r.pick(arr))
  })
})

describe('hhmm', () => {
  it('formats minutes of day', () => {
    expect(hhmm(0)).toBe('00:00')
    expect(hhmm(485)).toBe('08:05')
    expect(hhmm(1439)).toBe('23:59')
  })
  it('wraps past midnight and floors fractions', () => {
    expect(hhmm(1440)).toBe('00:00')
    expect(hhmm(810.9)).toBe('13:30')
  })
})
