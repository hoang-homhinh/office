import { describe, expect, it } from 'vitest'
import { skyAt, phaseOf } from './sky'

describe('skyAt', () => {
  it('is full day at noon', () => {
    const s = skyAt(720)
    expect(s.night).toBe(0)
    expect(s.sunIntensity).toBeGreaterThan(1.5)
    expect(s.sunDir[1]).toBeGreaterThan(0.6)
  })
  it('is full night at midnight and 03:00', () => {
    expect(skyAt(0).night).toBe(1)
    expect(skyAt(180).night).toBe(1)
    expect(skyAt(0).sunIntensity).toBe(0)
  })
  it('is in between during dusk (18:30)', () => {
    const n = skyAt(1110).night
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThan(1)
  })
  it('is warm in late afternoon', () => expect(skyAt(1030).warm).toBeGreaterThan(0.3))
  it('sun rises in the east (+x) and sets in the west (-x)', () => {
    expect(skyAt(480).sunDir[0]).toBeGreaterThan(0)
    expect(skyAt(1020).sunDir[0]).toBeLessThan(0)
  })
  it('returns hex colours', () => {
    const s = skyAt(900)
    for (const c of [s.bg, s.sunColor, s.hemiSky, s.hemiGround]) expect(c).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('phaseOf', () => {
  it('names the parts of the working day', () => {
    expect(phaseOf(300)).toBe('Đêm')
    expect(phaseOf(470)).toBe('Giờ vào làm')
    expect(phaseOf(515)).toBe('Họp standup')
    expect(phaseOf(600)).toBe('Làm buổi sáng')
    expect(phaseOf(750)).toBe('Nghỉ trưa')
    expect(phaseOf(900)).toBe('Làm buổi chiều')
    expect(phaseOf(1080)).toBe('Tan làm')
    expect(phaseOf(1250)).toBe('Buổi tối')
  })
})
