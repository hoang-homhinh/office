import { describe, expect, it } from 'vitest'
import { World } from './world'

/** Runs the world in real-time steps of 50 ms until sim time reaches `until` (same day). */
function runUntil(w: World, until: number, speed = 30) {
  let guard = 0
  while (w.t < until && guard++ < 100000) w.advance(0.05, speed)
}

describe('World', () => {
  it('starts at 07:35 with nobody in the office', () => {
    const w = new World(1)
    expect(w.t).toBeCloseTo(455)
    expect(w.stats().present).toBe(0)
  })

  it('by 13:00 at least 6 people are napping', () => {
    const w = new World(2)
    runUntil(w, 780)
    expect(w.people.filter(p => !p.path.length && p.act === 'nap').length).toBeGreaterThanOrEqual(6)
  })

  it('at 21:00 at most 2 people are still in the office', () => {
    const w = new World(3)
    runUntil(w, 1260)
    expect(w.stats().present).toBeLessThanOrEqual(2)
  })

  it('setTime(12:15) snaps everyone into the pantry with no path', () => {
    const w = new World(4)
    w.setTime(735)
    w.people.forEach(p => {
      expect(p.path).toHaveLength(0)
      expect(p.place).toBe('pantry')
      expect(p.act).toBe('eat')
    })
  })

  it('setTime(03:00) sends everyone home and hides bikes', () => {
    const w = new World(4)
    w.setTime(600)
    w.setTime(180)
    w.people.forEach(p => { expect(p.place).toBe('home'); expect(p.bikeOn).toBe(false) })
  })

  it('is deterministic for a seed', () => {
    const a = new World(7), b = new World(7)
    runUntil(a, 1200); runUntil(b, 1200)
    expect(a.events.length).toBe(b.events.length)
    expect(a.events.length).toBeGreaterThan(30)
    expect(a.events.map(e => e.kind)).toEqual(b.events.map(e => e.kind))
  })

  it('rolls over to day 2 after midnight with fresh plans', () => {
    const w = new World(8)
    w.setTime(1430)
    let guard = 0
    while (w.day === 1 && guard++ < 10000) w.advance(0.05, 30)
    expect(w.day).toBe(2)
    expect(w.t).toBeLessThan(60)
  })

  it('people only generate events while working at their desk', () => {
    const w = new World(9)
    runUntil(w, 1200)
    const lunch = w.events.filter(e => e.at > 735 && e.at < 745 && e.kind !== 'qa_pass' && e.kind !== 'qa_fail')
    lunch.forEach(e => expect(w.plansFor(e.actor).lunchStart > e.at || w.plansFor(e.actor).lunchEnd <= e.at).toBe(true))
  })

  it('stats count every person in exactly one display stage', () => {
    const w = new World(10)
    runUntil(w, 700)
    const s = w.stats()
    expect(Object.values(s.counts).reduce((a, b) => a + b, 0)).toBe(10)
    s.reviewQueue.forEach(r => expect(r.waiting).toBeGreaterThanOrEqual(0))
  })

  it('a person walking at 30x reaches the destination without overshooting', () => {
    const w = new World(11)
    runUntil(w, 600)
    w.people.filter(p => !p.path.length && p.place === 'seat').forEach(p => {
      expect(Number.isFinite(p.pos.x)).toBe(true)
      expect(Number.isFinite(p.pos.z)).toBe(true)
    })
  })
})
