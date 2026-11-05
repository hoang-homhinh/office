import type { Spot, Vec2 } from './types'

/**
 * Floor plan in metres. x → right, z → toward the camera (front of building).
 * Building: x 0..30, z 0..19. Corridors: vertical at x=VX (z<HZ), horizontal at z=HZ.
 */
export const BUILDING = { x0: 0, z0: 0, x1: 30, z1: 19 }
export const LOT = { x0: -3, z0: -3, x1: 33, z1: 29 }
export const VX = 19.75
export const HZ = 12

export type RoomId = 'dev' | 'meeting' | 'pantry' | 'server' | 'wc' | 'lounge' | 'lobby' | 'parking'
export interface Room { id: RoomId; name: string; rect: [number, number, number, number]; color: string; icon: string }

export const ROOMS: Room[] = [
  { id: 'dev', name: 'Khu Dev', rect: [0, 0, 19, 11], color: '#4C8DFF', icon: 'code' },
  { id: 'meeting', name: 'Phòng họp', rect: [20.5, 0, 30, 5], color: '#A274FF', icon: 'users' },
  { id: 'pantry', name: 'Pantry', rect: [20.5, 5, 30, 11], color: '#F2A93B', icon: 'coffee' },
  { id: 'lounge', name: 'Khu thư giãn', rect: [0, 13, 10, 19], color: '#35C2A1', icon: 'sofa' },
  { id: 'lobby', name: 'Sảnh', rect: [10, 13, 19, 19], color: '#8FA3B8', icon: 'door' },
  { id: 'server', name: 'Phòng server', rect: [19, 13, 24.5, 19], color: '#2FD3E6', icon: 'server' },
  { id: 'wc', name: 'WC', rect: [24.5, 13, 30, 19], color: '#7FB2D9', icon: 'droplet' },
  { id: 'parking', name: 'Bãi xe', rect: [1, 20, 9.4, 24.6], color: '#9AA5B1', icon: 'bike' },
]

/** Desk clusters: [x, z] of the first desk's back-left corner. 5 desks wide, two facing rows. */
export const CLUSTERS: [number, number][] = [[1.2, 1.6], [10, 1.6], [1.2, 7], [10, 7]]
export const TEAM_CLUSTER = 3
export const DESK_W = 1.2
export const DESK_D = 0.7
export const DESK_STEP = 1.3

export function clusterSeats(ci: number): Spot[] {
  const [cx, cz] = CLUSTERS[ci]
  const out: Spot[] = []
  for (let i = 0; i < 5; i++) out.push({ x: cx + i * DESK_STEP + 0.6, z: cz - 0.5, face: 1 })
  for (let i = 0; i < 5; i++) out.push({ x: cx + i * DESK_STEP + 0.6, z: cz + 1.9, face: -1 })
  return out
}
export const SEATS: Spot[] = CLUSTERS.flatMap((_, ci) => clusterSeats(ci))
export const TEAM_SEATS: Spot[] = clusterSeats(TEAM_CLUSTER)
export const SEAT_AISLE_X = 17.2

export const MEET_TABLE = { x0: 22, z0: 1.7, x1: 27, z1: 3.3 }
export const MEET_CHAIRS: Spot[] = [
  ...[0, 1, 2, 3, 4].map(i => ({ x: 22.5 + i, z: 1.2, face: 1 })),
  ...[0, 1, 2, 3, 4].map(i => ({ x: 22.5 + i, z: 3.8, face: -1 })),
]
export const PANTRY_TABLES = [{ x0: 22, z0: 7.0, x1: 28, z1: 7.8 }, { x0: 22, z0: 9.2, x1: 28, z1: 10.0 }]
export const PANTRY_SEATS: Spot[] = [
  ...[0, 1, 2, 3, 4].map(i => ({ x: 22.5 + i, z: 6.55, face: 1 })),
  ...[0, 1, 2, 3, 4].map(i => ({ x: 22.5 + i, z: 8.25, face: -1 })),
]
export const SOFA_SPOTS: Spot[] = [{ x: 1.6, z: 13.95, face: 1 }, { x: 2.8, z: 13.95, face: 1 }, { x: 4.0, z: 13.95, face: 1 }]
export const WC_SPOTS: Spot[] = [{ x: 25.95, z: 17.9, face: -1 }, { x: 27.3, z: 17.9, face: -1 }]
export const BIKE_SPOTS: Vec2[] = [
  ...[0, 1, 2, 3, 4].map(i => ({ x: 1.6 + i * 1.5, z: 20.4 })),
  ...[0, 1, 2, 3, 4].map(i => ({ x: 1.6 + i * 1.5, z: 23.0 })),
]

/** Walls with door gaps. axis 'x' runs along x at fixed z; axis 'z' runs along z at fixed x. */
export type WallKind = 'outer' | 'glass' | 'stub'
export interface WallDef { axis: 'x' | 'z'; fixed: number; from: number; to: number; kind: WallKind; doors?: [number, number][] }
export const WALLS: WallDef[] = [
  { axis: 'x', fixed: 0, from: 0, to: 30, kind: 'outer' },
  { axis: 'z', fixed: 0, from: 0, to: 19, kind: 'outer' },
  { axis: 'x', fixed: 19, from: 0, to: 30, kind: 'stub', doors: [[13.7, 15.3]] },
  { axis: 'z', fixed: 30, from: 0, to: 19, kind: 'stub' },
  { axis: 'z', fixed: 20.5, from: 0, to: 11, kind: 'glass', doors: [[1.8, 3.2], [7.3, 8.7]] },
  { axis: 'x', fixed: 5, from: 20.5, to: 30, kind: 'glass' },
  { axis: 'x', fixed: 11, from: 20.5, to: 30, kind: 'glass' },
  { axis: 'x', fixed: 13, from: 0, to: 30, kind: 'glass', doors: [[4.3, 5.7], [13.5, 15.5], [20.8, 22.2], [25.4, 26.6]] },
  { axis: 'z', fixed: 10, from: 13, to: 19, kind: 'glass' },
  { axis: 'z', fixed: 19, from: 13, to: 19, kind: 'glass' },
  { axis: 'z', fixed: 24.5, from: 13, to: 19, kind: 'glass' },
]

/** Splits a wall into solid intervals (door gaps removed). */
export function solidIntervals(w: WallDef): [number, number][] {
  let segs: [number, number][] = [[w.from, w.to]]
  for (const [d0, d1] of w.doors ?? []) {
    segs = segs.flatMap(([s0, s1]): [number, number][] => {
      if (d1 <= s0 || d0 >= s1) return [[s0, s1]]
      const parts: [number, number][] = [[s0, Math.max(s0, d0)], [Math.min(s1, d1), s1]]
      return parts.filter(([u, v]) => v - u > 0.01)
    })
  }
  return segs
}

export function wallSegments(): { a: Vec2; b: Vec2 }[] {
  return WALLS.flatMap(w => solidIntervals(w).map(([u, v]) =>
    w.axis === 'x' ? { a: { x: u, z: w.fixed }, b: { x: v, z: w.fixed } } : { a: { x: w.fixed, z: u }, b: { x: w.fixed, z: v } }))
}
