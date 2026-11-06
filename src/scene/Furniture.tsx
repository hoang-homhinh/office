import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import {
  CLUSTERS, DESK_D, DESK_STEP, DESK_W, MEET_CHAIRS, MEET_TABLE, PANTRY_SEATS, PANTRY_TABLES, SEATS, TEAM_CLUSTER, clusterSeats,
} from '../sim/layout'
import type { Spot } from '../sim/types'
import { Block, Cyl, Plant } from './Block'
import { getDyn } from './dynamic'
import { mat, PALETTE } from './materials'
import { label } from './textures'

/* ---------------- shared chair (instanced) ---------------- */
function Chairs({ spots }: { spots: Spot[] }) {
  const seat = mat(PALETTE.chair, { rough: 0.8 })
  const base = mat(PALETTE.darkMetal, { rough: 0.4, metal: 0.6 })
  return (
    <group>
      <Instances limit={spots.length} castShadow receiveShadow material={seat}>
        <boxGeometry args={[0.46, 0.08, 0.44]} />
        {spots.map((s, i) => <Instance key={i} position={[s.x, 0.44, s.z]} />)}
      </Instances>
      <Instances limit={spots.length} castShadow material={seat}>
        <boxGeometry args={[0.44, 0.5, 0.06]} />
        {spots.map((s, i) => <Instance key={i} position={[s.x, 0.74, s.z - 0.24 * s.face]} />)}
      </Instances>
      <Instances limit={spots.length} castShadow material={base}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        {spots.map((s, i) => <Instance key={i} position={[s.x, 0.2, s.z]} />)}
      </Instances>
      <Instances limit={spots.length} receiveShadow material={base}>
        <cylinderGeometry args={[0.24, 0.24, 0.03, 5]} />
        {spots.map((s, i) => <Instance key={i} position={[s.x, 0.03, s.z]} />)}
      </Instances>
    </group>
  )
}

/* ---------------- dev area: 4 clusters × 10 desks ---------------- */
function DevArea() {
  const dyn = getDyn()
  const desks = useMemo(() => {
    const out: { x: number; z: number; ci: number; row: 0 | 1; i: number }[] = []
    CLUSTERS.forEach(([cx, cz], ci) => {
      for (let i = 0; i < 5; i++) {
        out.push({ x: cx + i * DESK_STEP, z: cz, ci, row: 0, i })
        out.push({ x: cx + i * DESK_STEP, z: cz + DESK_D, ci, row: 1, i })
      }
    })
    return out
  }, [])
  const top = mat(PALETTE.deskTop, { rough: 0.5 })
  const leg = mat(PALETTE.metal, { rough: 0.35, metal: 0.7 })
  const bezel = mat(PALETTE.bezel, { rough: 0.4 })
  const kb = mat('#2A2F36', { rough: 0.6 })
  const divider = mat('#4F8F88', { rough: 0.95 })
  return (
    <group>
      <Instances limit={40} castShadow receiveShadow material={top}>
        <boxGeometry args={[DESK_W, 0.04, DESK_D]} />
        {desks.map((d, k) => <Instance key={k} position={[d.x + DESK_W / 2, 0.74, d.z + DESK_D / 2]} />)}
      </Instances>
      <Instances limit={80} castShadow material={leg}>
        <boxGeometry args={[0.04, 0.72, DESK_D - 0.06]} />
        {desks.flatMap((d, k) => [
          <Instance key={`a${k}`} position={[d.x + 0.04, 0.36, d.z + DESK_D / 2]} />,
          <Instance key={`b${k}`} position={[d.x + DESK_W - 0.04, 0.36, d.z + DESK_D / 2]} />,
        ])}
      </Instances>
      {/* monitors */}
      <Instances limit={40} castShadow material={bezel}>
        <boxGeometry args={[0.6, 0.36, 0.035]} />
        {desks.map((d, k) => <Instance key={k} position={[d.x + DESK_W / 2, 1.0, d.row === 0 ? d.z + 0.52 : d.z + 0.18]} />)}
      </Instances>
      <Instances limit={40} material={bezel}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        {desks.map((d, k) => <Instance key={k} position={[d.x + DESK_W / 2, 0.86, d.row === 0 ? d.z + 0.55 : d.z + 0.15]} />)}
      </Instances>
      <Instances limit={40} receiveShadow material={kb}>
        <boxGeometry args={[0.44, 0.02, 0.14]} />
        {desks.map((d, k) => <Instance key={k} position={[d.x + DESK_W / 2, 0.77, d.row === 0 ? d.z + 0.2 : d.z + 0.5]} />)}
      </Instances>
      {/* screens: team cluster gets per-person emissive material */}
      {desks.map((d, k) => {
        const seatIdx = d.row * 5 + d.i
        const material = d.ci === TEAM_CLUSTER ? dyn.teamScreens[seatIdx] : dyn.idleScreen
        const z = d.row === 0 ? d.z + 0.5 : d.z + 0.2
        return (
          <mesh key={k} position={[d.x + DESK_W / 2, 1.0, z]} rotation={[0, d.row === 0 ? Math.PI : 0, 0]} material={material}>
            <planeGeometry args={[0.54, 0.3]} />
          </mesh>
        )
      })}
      {/* privacy dividers between facing rows */}
      {CLUSTERS.map(([cx, cz], ci) => (
        <Block key={ci} x={cx} z={cz + DESK_D - 0.02} w={DESK_STEP * 4 + DESK_W} d={0.04} y={0.76} h={0.34} material={divider} />
      ))}
      <Chairs spots={SEATS} />
      {/* pendant lights above each cluster */}
      {CLUSTERS.map(([cx, cz], ci) => (
        <group key={ci}>
          {[0.25, 1.15].map(o => (
            <mesh key={o} position={[cx + 3.2, 2.7, cz + o]} material={ci === TEAM_CLUSTER ? dyn.pendantTeam : dyn.pendantOther}>
              <boxGeometry args={[5.4, 0.05, 0.12]} />
            </mesh>
          ))}
          {[0.4, 6.0].map(o => <Block key={o} x={cx + o} z={cz + 0.7} w={0.01} d={0.01} y={2.72} h={0.5} color={PALETTE.darkMetal} cast={false} />)}
        </group>
      ))}
      {/* cluster end plants + team marker cups */}
      {CLUSTERS.map(([cx, cz], ci) => <Plant key={ci} x={cx + 6.85} z={cz + 0.7} s={0.9} />)}
      {clusterSeats(TEAM_CLUSTER).map((s, i) => (
        <Cyl key={i} x={s.x + 0.38} z={s.z + 0.55 * s.face} r={0.04} h={0.1} y={0.76} color={['#E85D4A', '#3D7DD8', '#F2B33D', '#3CB37A', '#8E6AD8'][i % 5]} />
      ))}
    </group>
  )
}

/* ---------------- meeting room ---------------- */
function Meeting() {
  const dyn = getDyn()
  const t = MEET_TABLE
  return (
    <group>
      <Block x={t.x0} z={t.z0} w={t.x1 - t.x0} d={t.z1 - t.z0} y={0.72} h={0.06} color={PALETTE.walnut} m={{ rough: 0.45 }} />
      <Block x={t.x0 + 0.8} z={t.z0 + 0.5} w={0.3} d={0.6} h={0.72} color={PALETTE.darkMetal} />
      <Block x={t.x1 - 1.1} z={t.z0 + 0.5} w={0.3} d={0.6} h={0.72} color={PALETTE.darkMetal} />
      <Chairs spots={MEET_CHAIRS} />
      {/* wall TV */}
      <Block x={23.15} z={0.02} w={2.7} d={0.07} y={1.0} h={1.5} color={PALETTE.bezel} />
      <mesh position={[24.5, 1.75, 0.095]} material={dyn.tv}><planeGeometry args={[2.56, 1.38]} /></mesh>
      <Block x={22.4} z={0.05} w={4.2} d={0.4} h={0.55} color="#E8E4DD" />
      <Plant x={29.3} z={0.6} s={1.15} />
      <Plant x={21.1} z={4.4} s={0.9} />
    </group>
  )
}

/* ---------------- pantry ---------------- */
function Pantry() {
  const stools = [
    ...PANTRY_SEATS,
    ...[0, 1, 2, 3, 4].map(i => ({ x: 22.5 + i, z: 8.75, face: 1 })),
    ...[0, 1, 2, 3, 4].map(i => ({ x: 22.5 + i, z: 10.45, face: -1 })),
  ]
  const wood = mat(PALETTE.oak, { rough: 0.6 })
  return (
    <group>
      {/* counter + cabinets */}
      <Block x={22.2} z={5.12} w={6.9} d={0.66} h={0.86} color="#F4F2EE" m={{ rough: 0.5 }} />
      <Block x={22.15} z={5.08} w={7.0} d={0.72} y={0.86} h={0.05} color="#3C4148" m={{ rough: 0.3 }} />
      {[0, 1, 2, 3, 4, 5].map(i => <Block key={i} x={22.35 + i * 1.12} z={5.79} w={1.0} d={0.01} y={0.12} h={0.66} color="#E3E0DA" cast={false} />)}
      <Block x={29.15} z={5.12} w={0.78} d={0.72} h={1.95} color="#D9DEE3" m={{ rough: 0.25, metal: 0.5 }} />
      <Block x={23.0} z={5.2} w={0.45} d={0.38} y={0.91} h={0.42} color="#2B2F35" m={{ rough: 0.4, metal: 0.4 }} />
      <Block x={24.0} z={5.18} w={0.55} d={0.4} y={0.91} h={0.32} color="#CED3D8" m={{ rough: 0.3, metal: 0.5 }} />
      <Cyl x={27.4} z={5.4} r={0.18} h={0.08} y={0.91} color="#F0EDE6" />
      {[[27.33, 5.36, '#E24A3B'], [27.45, 5.44, '#F2B33D'], [27.4, 5.3, '#6BB04E']].map(([x, z, c], i) => (
        <mesh key={i} position={[x as number, 1.03, z as number]} castShadow material={mat(c as string, { rough: 0.5 })}><sphereGeometry args={[0.06, 10, 8]} /></mesh>
      ))}
      {/* tables */}
      {PANTRY_TABLES.map((t, i) => (
        <group key={i}>
          <Block x={t.x0} z={t.z0} w={t.x1 - t.x0} d={t.z1 - t.z0} y={0.72} h={0.05} color="#F6F4F0" m={{ rough: 0.4 }} />
          {[t.x0 + 0.3, t.x1 - 0.35].map(x => <Block key={x} x={x} z={t.z0 + 0.25} w={0.06} d={0.3} h={0.72} color={PALETTE.darkMetal} />)}
        </group>
      ))}
      <Instances limit={stools.length} castShadow receiveShadow material={wood}>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 14]} />
        {stools.map((s, i) => <Instance key={i} position={[s.x, 0.46, s.z]} />)}
      </Instances>
      <Instances limit={stools.length} castShadow material={mat(PALETTE.darkMetal, { metal: 0.6, rough: 0.4 })}>
        <cylinderGeometry args={[0.025, 0.12, 0.44, 8]} />
        {stools.map((s, i) => <Instance key={i} position={[s.x, 0.22, s.z]} />)}
      </Instances>
      {/* water dispenser + plants */}
      <Block x={21.0} z={9.6} w={0.35} d={0.35} h={1.0} color="#F2F2F2" />
      <Cyl x={21.175} z={9.775} r={0.14} h={0.4} y={1.0} color="#9FD1EA" m={{ opacity: 0.7, rough: 0.1 }} />
      <Plant x={29.4} z={10.5} s={1.1} />
    </group>
  )
}

/* ---------------- server room ---------------- */
function Server() {
  const dyn = getDyn()
  const racks = useMemo(() => {
    const out: { x: number; z: number }[] = []
    for (const z of [15.0, 17.0]) for (let i = 0; i < 4; i++) out.push({ x: 19.6 + i * 1.05, z })
    return out
  }, [])
  const leds = useMemo(() => {
    const a: [number, number, number][] = [], b: [number, number, number][] = []
    racks.forEach((r, ri) => {
      for (let row = 0; row < 9; row++) for (let col = 0; col < 3; col++) {
        const p: [number, number, number] = [r.x + 0.2 + col * 0.22, 0.35 + row * 0.18, r.z + 0.905]
        ;((row + col + ri) % 4 === 0 ? b : a).push(p)
      }
    })
    return { a, b }
  }, [racks])
  return (
    <group>
      {racks.map((r, i) => (
        <group key={i}>
          <Block x={r.x} z={r.z} w={0.9} d={0.9} h={2.05} color="#1E242B" m={{ rough: 0.35, metal: 0.5 }} />
          <Block x={r.x + 0.05} z={r.z + 0.9} w={0.8} d={0.004} y={0.15} h={1.8} color="#2A323B" m={{ rough: 0.3, metal: 0.6 }} cast={false} />
        </group>
      ))}
      <Instances limit={leds.a.length} material={dyn.rackLed}>
        <boxGeometry args={[0.12, 0.025, 0.01]} />
        {leds.a.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>
      <Instances limit={leds.b.length} material={dyn.rackLedAlt}>
        <boxGeometry args={[0.12, 0.025, 0.01]} />
        {leds.b.map((p, i) => <Instance key={i} position={p} />)}
      </Instances>
      {/* cable tray + cooling unit + console */}
      <Block x={19.4} z={16.25} w={4.6} d={0.3} y={2.25} h={0.08} color="#5B6672" m={{ metal: 0.6, rough: 0.4 }} cast={false} />
      <Block x={23.7} z={13.4} w={0.65} d={0.8} h={1.9} color="#E7EBEE" m={{ rough: 0.4 }} />
      <Block x={19.3} z={13.3} w={1.2} d={0.55} y={0.72} h={0.04} color="#F3F1EC" />
      <Block x={19.6} z={13.42} w={0.55} d={0.04} y={0.8} h={0.32} color={PALETTE.bezel} />
    </group>
  )
}

/* ---------------- lounge ---------------- */
function Lounge() {
  const teal = mat(PALETTE.fabricTeal, { rough: 0.95 })
  const books = ['#C95F4A', '#4F7FA6', '#E0B04A', '#6A9A62', '#9A6AA8', '#3E4A5C']
  return (
    <group>
      {/* sofa (nap spot) */}
      <Block x={0.9} z={13.45} w={3.8} d={0.9} h={0.42} material={teal} />
      <Block x={0.9} z={13.2} w={3.8} d={0.28} h={0.9} material={teal} />
      <Block x={0.75} z={13.2} w={0.2} d={1.15} h={0.62} material={teal} />
      <Block x={4.65} z={13.2} w={0.2} d={1.15} h={0.62} material={teal} />
      {[1.3, 2.5, 3.7].map(x => <Block key={x} x={x} z={13.32} w={0.55} d={0.18} y={0.45} h={0.38} color="#F2C14E" m={{ rough: 0.9 }} />)}
      {/* rug + coffee table */}
      <Block x={1.1} z={14.8} w={3.6} d={2.2} h={0.012} y={0.02} color="#D9C9AE" m={{ rough: 1 }} cast={false} />
      <Block x={1.9} z={15.1} w={1.8} d={0.6} y={0.34} h={0.05} color={PALETTE.oak} />
      {[2.0, 3.55].map(x => <Block key={x} x={x} z={15.2} w={0.05} d={0.4} h={0.34} color={PALETTE.darkMetal} />)}
      {/* ping-pong */}
      <Block x={6.0} z={15.0} w={2.74} d={1.52} y={0.72} h={0.04} color="#2F7D5B" m={{ rough: 0.6 }} />
      <Block x={6.0 + 1.37 - 0.01} z={14.95} w={0.02} d={1.62} y={0.76} h={0.15} color="#F4F4F4" m={{ opacity: 0.8 }} cast={false} />
      {[6.2, 8.5].map(x => <Block key={x} x={x} z={15.6} w={0.08} d={0.3} h={0.72} color={PALETTE.darkMetal} />)}
      {/* bean bags */}
      {[[6.4, 17.9, '#E0A43A'], [7.9, 18.1, '#6A9FB5'], [9.1, 17.6, '#C0674A']].map(([x, z, c], i) => (
        <mesh key={i} position={[x as number, 0.25, z as number]} scale={[1, 0.62, 1]} castShadow receiveShadow material={mat(c as string, { rough: 0.95 })}>
          <sphereGeometry args={[0.42, 18, 12]} />
        </mesh>
      ))}
      {/* bookshelf */}
      <Block x={0.05} z={15.3} w={0.38} d={3.2} h={1.9} color={PALETTE.walnut} />
      {[0, 1, 2, 3].map(s => books.map((c, i) => (
        <Block key={`${s}${i}`} x={0.12} z={15.4 + i * 0.5 + (s % 2) * 0.1} w={0.28} d={0.32} y={0.12 + s * 0.45} h={0.3} color={c} cast={false} />
      )))}
      <Plant x={9.4} z={13.6} s={1.1} />
      <Plant x={0.6} z={18.5} s={1.0} />
    </group>
  )
}

/* ---------------- lobby ---------------- */
function Lobby() {
  const logo = label('TEAM DEV', 'Văn phòng phát triển phần mềm', '#17324A', '#FFFFFF', '#2FD3E6')
  return (
    <group>
      <Block x={15.6} z={16.75} w={2.8} d={0.6} h={1.05} color="#F4F2EE" m={{ rough: 0.4 }} />
      <Block x={15.55} z={16.7} w={2.9} d={0.7} y={1.05} h={0.05} color={PALETTE.oak} />
      <mesh position={[17.0, 0.58, 17.36]} material={mat('#ffffff', { map: logo, rough: 0.5 })}><planeGeometry args={[2.4, 0.75]} /></mesh>
      <Block x={16.7} z={16.25} w={0.45} d={0.42} y={0.44} h={0.08} color={PALETTE.chair} />
      {/* totem sign facing the entrance */}
      <Block x={11.0} z={14.0} w={1.4} d={0.12} h={2.1} color="#17324A" />
      <mesh position={[11.7, 1.45, 14.125]} material={mat('#ffffff', { map: logo, rough: 0.5 })}><planeGeometry args={[1.3, 0.41]} /></mesh>
      {/* waiting sofa */}
      <Block x={10.5} z={18.0} w={2.2} d={0.75} h={0.4} color={PALETTE.fabricRust} m={{ rough: 0.95 }} />
      <Block x={10.5} z={18.55} w={2.2} d={0.22} h={0.82} color={PALETTE.fabricRust} m={{ rough: 0.95 }} />
      <Plant x={10.6} z={13.6} s={1.15} />
      <Plant x={18.4} z={13.6} s={1.15} />
      <Plant x={18.4} z={18.4} s={1.0} />
      {/* door mat */}
      <Block x={13.9} z={18.2} w={1.2} d={0.7} h={0.012} y={0.02} color="#4A4F57" cast={false} />
    </group>
  )
}

/* ---------------- WC ---------------- */
function WC() {
  const part = mat('#C7D5DC', { rough: 0.5 })
  return (
    <group>
      {[25.3, 26.62, 27.95].map(x => <Block key={x} x={x} z={16.5} w={0.05} d={2.45} h={2.0} material={part} />)}
      {[25.95, 27.3].map(x => (
        <group key={x}>
          <Block x={x - 0.2} z={18.55} w={0.4} d={0.4} h={0.42} color="#FAFAFA" m={{ rough: 0.2 }} />
          <Block x={x - 0.2} z={18.85} w={0.4} d={0.12} y={0.42} h={0.4} color="#FAFAFA" m={{ rough: 0.2 }} />
        </group>
      ))}
      <Block x={28.3} z={13.2} w={1.6} d={0.5} h={0.85} color="#E9EDF0" />
      {[28.7, 29.5].map(x => <Cyl key={x} x={x} z={13.45} r={0.16} h={0.06} y={0.85} color="#FFFFFF" />)}
      <Plant x={29.5} z={16.0} s={0.8} />
    </group>
  )
}

export function Furniture() {
  return (
    <group>
      <DevArea />
      <Meeting />
      <Pantry />
      <Server />
      <Lounge />
      <Lobby />
      <WC />
    </group>
  )
}
