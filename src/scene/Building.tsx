import { useMemo } from 'react'
import { BUILDING, HZ, ROOMS, VX, WALLS, solidIntervals, type RoomId } from '../sim/layout'
import { Block } from './Block'
import { mat, PALETTE } from './materials'
import { carpet, planks, raisedFloor, tiles } from './textures'

const FLOOR_Y = 0.02

function floorMat(id: RoomId | 'corridor', w: number, d: number) {
  switch (id) {
    case 'dev': return mat('#ffffff', { map: planks('#D7BB93', w, d), rough: 0.6 })
    case 'meeting': return mat('#ffffff', { map: carpet('#56657F', w, d), rough: 0.95 })
    case 'pantry': return mat('#ffffff', { map: tiles('#F1ECE2', '#E3DBCB', '#CFC6B5', w, d, 0.5), rough: 0.45 })
    case 'lounge': return mat('#ffffff', { map: planks('#C89F72', w, d), rough: 0.6 })
    case 'lobby': return mat('#ffffff', { map: tiles('#DEDBD5', '#D6D3CC', '#C4C0B8', w, d, 1), rough: 0.35 })
    case 'server': return mat('#ffffff', { map: raisedFloor(w, d), rough: 0.5, metal: 0.2 })
    case 'wc': return mat('#ffffff', { map: tiles('#E2EEF2', '#D3E5EA', '#BCD0D6', w, d, 0.3), rough: 0.3 })
    case 'corridor': return mat('#ffffff', { map: tiles('#E6E3DD', '#E1DED7', '#D0CCC4', w, d, 1), rough: 0.5 })
    default: return mat('#cccccc')
  }
}

/** Glowing floor strip around a room, in the room's colour (picked up by bloom). */
function RoomEdge({ rect, color }: { rect: [number, number, number, number]; color: string }) {
  const [x0, z0, x1, z1] = rect
  const t = 0.06, inset = 0.12, y = FLOOR_Y + 0.012
  const m = mat(color, { emissive: color, ei: 1.6, rough: 0.4 })
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, y, z1 - inset]} material={m}><boxGeometry args={[x1 - x0 - inset * 2, 0.012, t]} /></mesh>
      <mesh position={[(x0 + x1) / 2, y, z0 + inset]} material={m}><boxGeometry args={[x1 - x0 - inset * 2, 0.012, t]} /></mesh>
      <mesh position={[x0 + inset, y, (z0 + z1) / 2]} material={m}><boxGeometry args={[t, 0.012, z1 - z0 - inset * 2]} /></mesh>
      <mesh position={[x1 - inset, y, (z0 + z1) / 2]} material={m}><boxGeometry args={[t, 0.012, z1 - z0 - inset * 2]} /></mesh>
    </group>
  )
}

function Floors() {
  const indoor = ROOMS.filter(r => r.id !== 'parking')
  return (
    <group>
      {/* slab */}
      <Block x={BUILDING.x0 - 0.3} z={BUILDING.z0 - 0.3} w={BUILDING.x1 - BUILDING.x0 + 0.6} d={BUILDING.z1 - BUILDING.z0 + 0.6} h={0.3} y={-0.3} color="#B9B3A8" cast={false} />
      {/* corridors */}
      <mesh position={[(VX - 0.75 + VX + 0.75) / 2, FLOOR_Y / 2, 5.5]} receiveShadow material={floorMat('corridor', 1.5, 11)}>
        <boxGeometry args={[1.5, FLOOR_Y, 11]} />
      </mesh>
      <mesh position={[15, FLOOR_Y / 2, HZ]} receiveShadow material={floorMat('corridor', 30, 2)}>
        <boxGeometry args={[30, FLOOR_Y, 2]} />
      </mesh>
      {indoor.map(r => {
        const [x0, z0, x1, z1] = r.rect
        const w = x1 - x0, d = z1 - z0
        return (
          <group key={r.id}>
            <mesh position={[x0 + w / 2, FLOOR_Y / 2, z0 + d / 2]} receiveShadow material={floorMat(r.id, w, d)}>
              <boxGeometry args={[w, FLOOR_Y, d]} />
            </mesh>
            <RoomEdge rect={r.rect} color={r.color} />
          </group>
        )
      })}
    </group>
  )
}

const OUTER_H = 3.2
const GLASS_H = 2.5
const STUB_H = 0.55

/** Outer back wall with a band of windows. */
function OuterWall({ axis, fixed, u, v }: { axis: 'x' | 'z'; fixed: number; u: number; v: number }) {
  const t = 0.24
  const len = v - u
  const pieces = useMemo(() => {
    const out: { a: number; b: number }[] = []
    for (let a = u + 0.6; a + 1.6 < v - 0.3; a += 2.4) out.push({ a, b: a + 1.6 })
    return out
  }, [u, v])
  const along = (a: number, w: number, y: number, h: number, color: string, extra?: object) =>
    axis === 'x'
      ? <Block key={`${a}${y}`} x={a} z={fixed - t} w={w} d={t} y={y} h={h} color={color} {...extra} />
      : <Block key={`${a}${y}`} x={fixed - t} z={a} w={t} d={w} y={y} h={h} color={color} {...extra} />
  const wall = PALETTE.wallWhite
  return (
    <group>
      {along(u, len, 0, 0.95, wall)}
      {along(u, len, 2.35, OUTER_H - 2.35, wall)}
      {/* piers between windows */}
      {[u, ...pieces.map(p => p.b)].map((a, i) => {
        const next = i < pieces.length ? pieces[i].a : v
        return next - a > 0.01 ? along(a, next - a, 0.95, 1.4, wall) : null
      })}
      {pieces.map(p => (
        <group key={p.a}>
          {along(p.a, p.b - p.a, 0.95, 1.4, PALETTE.glass, { m: { opacity: 0.35, rough: 0.1, metal: 0.3, emissive: '#3A5A80', ei: 0.15 }, cast: false })}
          {along(p.a, p.b - p.a, 0.92, 0.05, PALETTE.frame)}
          {along(p.a + (p.b - p.a) / 2 - 0.02, 0.04, 0.95, 1.4, PALETTE.frame)}
        </group>
      ))}
      {/* top trim */}
      {along(u, len, OUTER_H, 0.06, PALETTE.wallTrim)}
    </group>
  )
}

/** Glass partition with slim dark frame. */
function GlassWall({ axis, fixed, u, v }: { axis: 'x' | 'z'; fixed: number; u: number; v: number }) {
  const len = v - u
  const posts: number[] = []
  const n = Math.max(1, Math.round(len / 1.25))
  for (let i = 0; i <= n; i++) posts.push(u + (len * i) / n)
  const glass = mat(PALETTE.glass, { opacity: 0.16, rough: 0.05, metal: 0.4 })
  const frame = mat(PALETTE.frame, { rough: 0.4, metal: 0.6 })
  const t = 0.05
  const center = (u + v) / 2
  return (
    <group>
      {axis === 'x' ? (
        <>
          <mesh position={[center, GLASS_H / 2, fixed]} material={glass}><boxGeometry args={[len, GLASS_H, 0.02]} /></mesh>
          <mesh position={[center, GLASS_H, fixed]} material={frame} castShadow><boxGeometry args={[len, 0.05, t]} /></mesh>
          <mesh position={[center, 0.04, fixed]} material={frame}><boxGeometry args={[len, 0.08, t]} /></mesh>
          {posts.map(p => <mesh key={p} position={[p, GLASS_H / 2, fixed]} material={frame} castShadow><boxGeometry args={[t, GLASS_H, t]} /></mesh>)}
        </>
      ) : (
        <>
          <mesh position={[fixed, GLASS_H / 2, center]} material={glass}><boxGeometry args={[0.02, GLASS_H, len]} /></mesh>
          <mesh position={[fixed, GLASS_H, center]} material={frame} castShadow><boxGeometry args={[t, 0.05, len]} /></mesh>
          <mesh position={[fixed, 0.04, center]} material={frame}><boxGeometry args={[t, 0.08, len]} /></mesh>
          {posts.map(p => <mesh key={p} position={[fixed, GLASS_H / 2, p]} material={frame} castShadow><boxGeometry args={[t, GLASS_H, t]} /></mesh>)}
        </>
      )}
    </group>
  )
}

function Walls() {
  return (
    <group>
      {WALLS.flatMap((w, wi) => solidIntervals(w).map(([u, v], k) => {
        const key = `${wi}-${k}`
        if (w.kind === 'outer') return <OuterWall key={key} axis={w.axis} fixed={w.fixed} u={u} v={v} />
        if (w.kind === 'glass') return <GlassWall key={key} axis={w.axis} fixed={w.fixed} u={u} v={v} />
        return w.axis === 'x'
          ? <Block key={key} x={u} z={w.fixed} w={v - u} d={0.22} h={STUB_H} color={PALETTE.wallWhite} />
          : <Block key={key} x={w.fixed} z={u} w={0.22} d={v - u} h={STUB_H} color={PALETTE.wallWhite} />
      }))}
      {/* corner column */}
      <Block x={-0.24} z={-0.24} w={0.24} d={0.24} h={OUTER_H + 0.06} color={PALETTE.wallTrim} />
    </group>
  )
}

export function Building() {
  return (
    <group>
      <Floors />
      <Walls />
    </group>
  )
}
