import { describe, expect, it } from 'vitest'
import { Rng } from './rng'
import { genDay } from './schedule'
import { TEAM } from '../config/team'
import { route, placeSpot } from './nav'
import { wallSegments, TEAM_SEATS, SEATS } from './layout'
import type { PlaceKey, Vec2 } from './types'

function cross(p: Vec2, q: Vec2, a: Vec2, b: Vec2): boolean {
  const o = (u: Vec2, v: Vec2, w: Vec2) => (v.x - u.x) * (w.z - u.z) - (v.z - u.z) * (w.x - u.x)
  const d1 = o(a, b, p), d2 = o(a, b, q), d3 = o(p, q, a), d4 = o(p, q, b)
  return ((d1 > 1e-9 && d2 < -1e-9) || (d1 < -1e-9 && d2 > 1e-9)) && ((d3 > 1e-9 && d4 < -1e-9) || (d3 < -1e-9 && d4 > 1e-9))
}

const plans = genDay(new Rng(5), TEAM)
plans[0].sofa = 0; plans[1].sofa = 1; plans[2].sofa = 2
const PLACES: PlaceKey[] = ['seat', 'meet', 'pantry', 'sofa', 'wc', 'parking']

describe('layout', () => {
  it('has 40 seats and the team cluster has 10', () => {
    expect(SEATS).toHaveLength(40)
    expect(TEAM_SEATS).toHaveLength(10)
  })
})

describe('route', () => {
  it('never crosses a wall between any two places, for every person', () => {
    const walls = wallSegments()
    for (let i = 0; i < TEAM.length; i++) for (const from of PLACES) for (const to of PLACES) {
      if (from === to) continue
      const start = placeSpot(i, from, plans[i])
      const pts = [start, ...route(i, plans[i], from, to)]
      for (let k = 0; k < pts.length - 1; k++) for (const w of walls) {
        if (cross(pts[k], pts[k + 1], w.a, w.b))
          throw new Error(`person ${i} ${from}->${to} leg ${k} crosses wall ${JSON.stringify(w)}`)
      }
    }
  })
  it('ends exactly at the destination spot', () => {
    for (const to of PLACES) {
      const pts = route(3, plans[3], 'seat', to)
      const end = pts[pts.length - 1], spot = placeSpot(3, to, plans[3])
      expect(end.x).toBeCloseTo(spot.x); expect(end.z).toBeCloseTo(spot.z)
    }
  })
  it('gives each team member a distinct seat', () => {
    const keys = TEAM.map((_, i) => { const s = placeSpot(i, 'seat', plans[i]); return `${s.x},${s.z}` })
    expect(new Set(keys).size).toBe(TEAM.length)
  })
})
