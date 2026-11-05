import {
  BIKE_SPOTS, HZ, MEET_CHAIRS, PANTRY_SEATS, SEAT_AISLE_X, SOFA_SPOTS, TEAM_SEATS, VX, WC_SPOTS,
} from './layout'
import type { DayPlan } from './schedule'
import type { PlaceKey, Spot, Vec2 } from './types'

interface Place { anchor: Vec2; entry: Vec2[]; spot: Spot }

/** Corridor anchor + waypoints from the anchor to the final spot. */
function placeOf(i: number, place: PlaceKey, plan: DayPlan): Place {
  switch (place) {
    case 'seat': {
      const s = TEAM_SEATS[i]
      return { anchor: { x: SEAT_AISLE_X, z: HZ }, entry: [{ x: SEAT_AISLE_X, z: s.z }, s], spot: s }
    }
    case 'meet': {
      const c = MEET_CHAIRS[i]
      return { anchor: { x: VX, z: 2.5 }, entry: [{ x: 21.2, z: 2.5 }, { x: 21.2, z: c.z }, c], spot: c }
    }
    case 'pantry': {
      const c = PANTRY_SEATS[i]
      return { anchor: { x: VX, z: 8 }, entry: [{ x: 21.2, z: 8 }, { x: 21.2, z: c.z }, c], spot: c }
    }
    case 'sofa': {
      const c = SOFA_SPOTS[Math.max(0, plan.sofa)]
      return { anchor: { x: 5, z: HZ }, entry: [{ x: 5, z: 14.8 }, { x: c.x, z: 14.8 }, c], spot: c }
    }
    case 'wc': {
      const c = WC_SPOTS[i % 2]
      return { anchor: { x: 26, z: HZ }, entry: [{ x: 26, z: 14.2 }, c], spot: c }
    }
    case 'parking':
    case 'home': {
      const b = BIKE_SPOTS[i]
      const s: Spot = { x: b.x + 0.6, z: b.z + 0.45, face: 1 }
      return {
        anchor: { x: 14.5, z: HZ },
        entry: [{ x: 14.5, z: 15.5 }, { x: 14.5, z: 19.6 }, { x: 14.5, z: 21.9 }, { x: 9.8, z: 21.9 }, s],
        spot: s,
      }
    }
  }
}

export function placeSpot(i: number, place: PlaceKey, plan: DayPlan): Spot {
  return placeOf(i, place, plan).spot
}

const onV = (p: Vec2) => Math.abs(p.x - VX) < 1e-6 && p.z < HZ - 1e-6

function corridor(a: Vec2, b: Vec2): Vec2[] {
  if (onV(a) && onV(b)) return [b]
  if (onV(a) || onV(b)) return [{ x: VX, z: HZ }, b]
  return [b]
}

/** Waypoints from the spot of `from` to the spot of `to` (start point excluded). */
export function route(i: number, plan: DayPlan, from: PlaceKey, to: PlaceKey): Vec2[] {
  const A = placeOf(i, from, plan), B = placeOf(i, to, plan)
  const out = [...A.entry.slice(0, -1).reverse(), A.anchor, ...corridor(A.anchor, B.anchor), ...B.entry]
  return out.map(p => ({ x: p.x, z: p.z }))
}
