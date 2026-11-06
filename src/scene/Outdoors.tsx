import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { source } from '../data/mockSource'
import { LOT } from '../sim/layout'
import { Block } from './Block'
import { getDyn } from './dynamic'
import { mat, PALETTE } from './materials'
import { asphalt, grass, label } from './textures'

export const LAMP_X = [2, 11, 20, 29]
const ROAD_Z0 = 26, ROAD_Z1 = 29.4

const TREES: [number, number, number][] = [
  [-1.6, -1.6, 1.2], [3, -1.8, 1], [8, -1.7, 1.1], [13, -1.9, 0.9], [18, -1.7, 1.15], [24, -1.8, 1], [29, -1.6, 1.1], [32, -1.2, 1],
  [-1.8, 3, 1], [-1.6, 8, 1.15], [-1.9, 12.5, 0.95], [-1.7, 17, 1.1], [-1.6, 21.5, 1],
  [31.8, 3.5, 1.05], [32, 8.5, 1], [31.7, 13, 1.15], [32, 18, 0.95], [31.6, 22.5, 1.1],
  [22, 21.2, 1.2], [25.5, 23.2, 1], [28.8, 21, 1.05], [18.5, 23.6, 0.85], [-1.2, 24.6, 0.9], [32.2, 24.8, 0.9],
]

function Ground() {
  const w = LOT.x1 - LOT.x0, d = 26 - LOT.z0
  return (
    <group>
      {/* far ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.32, 13]} receiveShadow material={mat('#6E9558', { rough: 1 })}>
        <planeGeometry args={[220, 220]} />
      </mesh>
      {/* lot lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LOT.x0 + w / 2, -0.02, LOT.z0 + d / 2]} receiveShadow material={mat('#ffffff', { map: grass(w, d), rough: 1 })}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* lot edge */}
      <Block x={LOT.x0} z={LOT.z0} w={w} d={0.12} h={0.1} y={-0.05} color="#D9D4CA" />
      <Block x={LOT.x0} z={LOT.z0} w={0.12} d={d} h={0.1} y={-0.05} color="#D9D4CA" />
      <Block x={LOT.x1 - 0.12} z={LOT.z0} w={0.12} d={d} h={0.1} y={-0.05} color="#D9D4CA" />
      {/* sidewalk + kerb */}
      <Block x={-60} z={25} w={150} d={1} h={0.08} y={-0.06} color={PALETTE.sidewalk} cast={false} />
      <Block x={-60} z={25.95} w={150} d={0.1} h={0.1} y={-0.06} color="#A9A49B" cast={false} />
      {/* road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.05, (ROAD_Z0 + ROAD_Z1) / 2]} receiveShadow material={mat('#ffffff', { map: asphalt(150, ROAD_Z1 - ROAD_Z0), rough: 0.9 })}>
        <planeGeometry args={[150, ROAD_Z1 - ROAD_Z0]} />
      </mesh>
      <Instances limit={40} material={mat('#EDE6CC', { rough: 0.6 })}>
        <boxGeometry args={[1.4, 0.01, 0.12]} />
        {Array.from({ length: 40 }, (_, i) => <Instance key={i} position={[-40 + i * 3, -0.04, (ROAD_Z0 + ROAD_Z1) / 2]} />)}
      </Instances>
      <Block x={-60} z={ROAD_Z1} w={150} d={1.2} h={0.08} y={-0.06} color={PALETTE.sidewalk} cast={false} />
      {/* parking pad + bays */}
      <Block x={1} z={20} w={8.4} d={4.6} h={0.03} y={-0.02} color="#BEBAB2" cast={false} />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <group key={i}>
          <Block x={1.05 + i * 1.5} z={20.1} w={0.05} d={1.6} h={0.005} y={0.012} color="#F4F1EA" cast={false} />
          <Block x={1.05 + i * 1.5} z={22.7} w={0.05} d={1.6} h={0.005} y={0.012} color="#F4F1EA" cast={false} />
        </group>
      ))}
      {/* paths */}
      <Block x={13.8} z={19} w={1.4} d={3.6} h={0.03} y={-0.02} color={PALETTE.pavers} cast={false} />
      <Block x={9.4} z={21.3} w={5.8} d={1.2} h={0.03} y={-0.02} color={PALETTE.pavers} cast={false} />
      <Block x={10.6} z={22.5} w={2.6} d={2.5} h={0.03} y={-0.02} color={PALETTE.pavers} cast={false} />
    </group>
  )
}

function Fence() {
  const posts: number[] = []
  for (let x = LOT.x0; x <= LOT.x1; x += 1) if (x < 10.4 || x > 13.6) posts.push(x)
  const white = mat('#F0EEE9', { rough: 0.6 })
  const sign = label('TEAM DEV', 'Cổng chính', '#17324A', '#FFFFFF', '#2FD3E6')
  return (
    <group>
      <Instances limit={posts.length} castShadow material={white}>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
        {posts.map(x => <Instance key={x} position={[x, 0.45, 24.9]} />)}
      </Instances>
      {[[LOT.x0, 10.4], [13.6, LOT.x1]].map(([a, b]) => [0.3, 0.75].map(y => (
        <Block key={`${a}${y}`} x={a} z={24.87} w={b - a} d={0.06} y={y} h={0.06} material={white} />
      )))}
      {[10.1, 13.6].map(x => <Block key={x} x={x} z={24.7} w={0.35} d={0.4} h={1.6} color="#7D8790" m={{ rough: 0.5 }} />)}
      <mesh position={[9.2, 1.1, 25.11]} material={mat('#ffffff', { map: sign })}><planeGeometry args={[1.6, 0.5]} /></mesh>
      <Block x={8.35} z={24.95} w={1.7} d={0.14} y={0.75} h={0.7} color="#17324A" />
    </group>
  )
}

function Trees() {
  const trunk = mat(PALETTE.trunk, { rough: 0.9 })
  const leaves = [mat(PALETTE.leaf, { flat: true, rough: 0.9 }), mat(PALETTE.leaf2, { flat: true, rough: 0.9 }), mat(PALETTE.leaf3, { flat: true, rough: 0.9 })]
  return (
    <group>
      <Instances limit={TREES.length} castShadow material={trunk}>
        <cylinderGeometry args={[0.1, 0.16, 1.4, 7]} />
        {TREES.map(([x, z, s], i) => <Instance key={i} position={[x, 0.7 * s, z]} scale={s} />)}
      </Instances>
      {leaves.map((m, k) => (
        <Instances key={k} limit={TREES.length} castShadow receiveShadow material={m}>
          <icosahedronGeometry args={[0.85, 0]} />
          {TREES.map(([x, z, s], i) => {
            const o = [[0, 1.9, 0, 1], [0.45, 1.55, 0.2, 0.75], [-0.4, 1.6, -0.2, 0.7]][k]
            return <Instance key={i} position={[x + o[0] * s, o[1] * s, z + o[2] * s]} scale={s * o[3]} rotation={[0, i * 1.3, 0]} />
          })}
        </Instances>
      ))}
    </group>
  )
}

function Lamps() {
  const dyn = getDyn()
  const pole = mat('#3B4046', { rough: 0.4, metal: 0.6 })
  return (
    <group>
      {LAMP_X.map(x => (
        <group key={x} position={[x, 0, 25.45]}>
          <mesh position={[0, 1.9, 0]} castShadow material={pole}><cylinderGeometry args={[0.05, 0.07, 3.8, 8]} /></mesh>
          <mesh position={[0, 3.8, 0.3]} material={pole}><boxGeometry args={[0.1, 0.06, 0.7]} /></mesh>
          <mesh position={[0, 3.74, 0.55]} material={dyn.lamp}><boxGeometry args={[0.28, 0.05, 0.36]} /></mesh>
        </group>
      ))}
      {[[27, 20.6], [6.2, 25.6 - 1]].slice(0, 1).map(([x, z]) => (
        <group key={x}>
          <Block x={x} z={z} w={1.5} d={0.45} y={0.42} h={0.06} color={PALETTE.oak} />
          <Block x={x + 0.1} z={z + 0.1} w={0.08} d={0.25} h={0.42} color="#3B4046" />
          <Block x={x + 1.32} z={z + 0.1} w={0.08} d={0.25} h={0.42} color="#3B4046" />
        </group>
      ))}
    </group>
  )
}

/* ---------------- traffic ---------------- */
interface Car { x: number; dir: 1 | -1; lane: number; v: number; kind: 'car' | 'bike'; color: string; on: boolean; wait: number }
const CAR_COLORS = ['#C94B3F', '#3E6FA8', '#E8E5DF', '#2F3337', '#D9A441', '#5E8E6E', '#8A93A0']

function traffic(t: number): number {
  const h = t / 60
  if (h < 5.5 || h >= 22.5) return 0.1
  if ((h >= 7 && h < 8.75) || (h >= 17 && h < 18.75)) return 0.95
  if (h >= 11.75 && h < 13.5) return 0.55
  return 0.35
}

export function Traffic() {
  const cars = useMemo<Car[]>(() => Array.from({ length: 10 }, (_, i) => ({
    x: -30 + i * 9, dir: i % 2 ? 1 : -1, lane: i % 2 ? 27.0 : 28.5, v: 6 + (i % 3) * 2,
    kind: i % 3 === 0 ? 'car' : 'bike', color: CAR_COLORS[i % CAR_COLORS.length], on: i % 2 === 0, wait: i * 0.4,
  })), [])
  const refs = useRef<(THREE.Group | null)[]>([])
  const lights = useRef<(THREE.Mesh | null)[]>([])
  const seed = useRef(1)
  const rnd = () => ((seed.current = (seed.current * 16807) % 2147483647) / 2147483647)
  useFrame((_, dt) => {
    const t = source.world.t
    const night = t < 360 || t > 1080
    cars.forEach((c, i) => {
      const g = refs.current[i]
      if (!g) return
      if (!c.on) {
        c.wait -= dt
        if (c.wait <= 0) {
          if (rnd() < traffic(t)) { c.on = true; c.x = c.dir > 0 ? -45 : 75; c.color = CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)] }
          else c.wait = 0.5 + rnd() * 2
        }
        g.visible = false
        return
      }
      c.x += c.dir * c.v * dt
      if (c.x > 76 || c.x < -46) { c.on = false; c.wait = rnd() * 1.5 }
      g.visible = true
      g.position.set(c.x, 0, c.lane)
      g.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2
      const l = lights.current[i]
      if (l) l.visible = night
    })
  })
  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} ref={el => { refs.current[i] = el }} visible={false}>
          {c.kind === 'car' ? (
            <>
              <mesh position={[0, 0.42, 0]} castShadow material={mat(c.color, { rough: 0.35, metal: 0.4 })}><boxGeometry args={[1.7, 0.5, 3.6]} /></mesh>
              <mesh position={[0, 0.85, -0.15]} castShadow material={mat('#2A333C', { rough: 0.2, metal: 0.5 })}><boxGeometry args={[1.5, 0.42, 1.9]} /></mesh>
              {[[-0.8, 1.15], [0.8, 1.15], [-0.8, -1.15], [0.8, -1.15]].map(([x, z], k) => (
                <mesh key={k} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]} material={mat('#16191C')}><cylinderGeometry args={[0.24, 0.24, 0.16, 12]} /></mesh>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, 0.45, 0]} castShadow material={mat(c.color, { rough: 0.4, metal: 0.3 })}><boxGeometry args={[0.32, 0.35, 1.5]} /></mesh>
              {[0.55, -0.55].map(z => (
                <mesh key={z} position={[0, 0.25, z]} rotation={[0, 0, Math.PI / 2]} material={mat('#16191C')}><torusGeometry args={[0.2, 0.06, 6, 14]} /></mesh>
              ))}
              <mesh position={[0, 0.95, -0.1]} castShadow material={mat('#3D4A5C', { rough: 0.8 })}><boxGeometry args={[0.36, 0.55, 0.3]} /></mesh>
              <mesh position={[0, 1.36, -0.1]} castShadow material={mat('#F1EDE3', { rough: 0.3 })}><sphereGeometry args={[0.17, 12, 10]} /></mesh>
            </>
          )}
          <mesh ref={el => { lights.current[i] = el }} position={[0, 0.5, c.kind === 'car' ? 1.82 : 0.78]} material={mat('#FFF6D8', { emissive: '#FFF1C4', ei: 6 })} visible={false}>
            <boxGeometry args={[c.kind === 'car' ? 1.3 : 0.15, 0.12, 0.04]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Static outdoor scenery (safe to merge). Traffic is exported separately because it moves. */
export function Outdoors() {
  return (
    <group>
      <Ground />
      <Fence />
      <Trees />
      <Lamps />
    </group>
  )
}
