import { describe, expect, it } from 'vitest'
import { Rng } from './rng'
import { genDay, want, type DayPlan } from './schedule'
import { TEAM } from '../config/team'

const base: DayPlan = {
  arrive: 470, leave: 1060, lunchStart: 721, lunchEnd: 752, napEnd: 808,
  sofa: -1, sprint: false, wc: [600, 900], overtime: false,
}

describe('genDay', () => {
  const plans = genDay(new Rng(11), TEAM)
  it('makes one plan per person', () => expect(plans).toHaveLength(TEAM.length))
  it('has exactly 3 sofa nappers with distinct spots', () => {
    const s = plans.map(p => p.sofa).filter(v => v >= 0)
    expect(s).toHaveLength(3)
    expect(new Set(s).size).toBe(3)
  })
  it('has exactly 2 overtime people leaving 19:00–20:30', () => {
    const ot = plans.filter(p => p.overtime)
    expect(ot).toHaveLength(2)
    ot.forEach(p => { expect(p.leave).toBeGreaterThanOrEqual(1140); expect(p.leave).toBeLessThanOrEqual(1230) })
  })
  it('has exactly 4 people in the sprint meeting', () => expect(plans.filter(p => p.sprint)).toHaveLength(4))
  it('keeps every plan ordered: arrive < lunch < nap end < leave', () => {
    plans.forEach(p => {
      expect(p.arrive).toBeLessThan(p.lunchStart)
      expect(p.lunchStart).toBeLessThan(p.lunchEnd)
      expect(p.lunchEnd).toBeLessThan(p.napEnd)
      expect(p.napEnd).toBeLessThanOrEqual(810)
      expect(p.leave).toBeGreaterThanOrEqual(1050)
    })
  })
  it('is deterministic for a seed', () => expect(genDay(new Rng(11), TEAM)).toEqual(plans))
})

describe('want', () => {
  it('is home before arrival and after leaving', () => {
    expect(want(base, 400)).toEqual({ place: 'home', act: 'home' })
    expect(want(base, 1060)).toEqual({ place: 'home', act: 'home' })
  })
  it('goes to standup at 08:30', () => expect(want(base, 515)).toEqual({ place: 'meet', act: 'standup' }))
  it('late arrivals skip standup until they arrive', () =>
    expect(want({ ...base, arrive: 520 }, 515)).toEqual({ place: 'home', act: 'home' }))
  it('eats lunch in the pantry', () => expect(want(base, 722)).toEqual({ place: 'pantry', act: 'eat' }))
  it('naps at the desk after lunch', () => expect(want(base, 760)).toEqual({ place: 'seat', act: 'nap' }))
  it('sofa nappers nap on the sofa', () => expect(want({ ...base, sofa: 1 }, 760)).toEqual({ place: 'sofa', act: 'nap' }))
  it('works at the desk otherwise', () => expect(want(base, 640)).toEqual({ place: 'seat', act: 'work' }))
  it('goes to the WC in its window', () => expect(want(base, 602)).toEqual({ place: 'wc', act: 'wc' }))
  it('sprint meeting only for invited people', () => {
    expect(want({ ...base, sprint: true }, 910)).toEqual({ place: 'meet', act: 'sprint' })
    expect(want(base, 910)).toEqual({ place: 'seat', act: 'work' })
  })
  it('overtime people keep working after 17:30', () =>
    expect(want({ ...base, overtime: true, leave: 1180 }, 1100)).toEqual({ place: 'seat', act: 'work' }))
})
