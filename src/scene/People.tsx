import { Html, RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { source } from '../data/mockSource'
import { BIKE_SPOTS } from '../sim/layout'
import type { DisplayStage, PersonConfig } from '../sim/types'
import { useOffice } from '../store'
import { STAGE_META } from '../ui/stages'
import { mat } from './materials'

type Pose = 'walk' | 'stand' | 'type' | 'sitIdle' | 'deskNap' | 'sofaNap' | 'eat'

interface Rig {
  root: THREE.Group | null
  hipL: THREE.Group | null
  hipR: THREE.Group | null
  upper: THREE.Group | null
  armL: THREE.Group | null
  armR: THREE.Group | null
  head: THREE.Group | null
  ring: THREE.Mesh | null
}

const damp = (a: number, b: number, k: number) => a + (b - a) * k
function dampAngle(a: number, b: number, k: number) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}

function matchesFocus(stage: DisplayStage, focus: string | null) {
  if (!focus) return true
  return stage === focus || (focus === 'qa' && stage === 'test')
}

function Person({ idx, cfg }: { idx: number; cfg: PersonConfig }) {
  const rig = useRef<Rig>({ root: null, hipL: null, hipR: null, upper: null, armL: null, armR: null, head: null, ring: null })
  const mats = useMemo(() => ({
    shirt: new THREE.MeshStandardMaterial({ color: cfg.shirt, roughness: 0.8 }),
    pants: new THREE.MeshStandardMaterial({ color: cfg.pants, roughness: 0.85 }),
    skin: new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: cfg.hair, roughness: 0.9 }),
    shoe: new THREE.MeshStandardMaterial({ color: '#23262A', roughness: 0.6 }),
  }), [cfg])
  const phase = useMemo(() => idx * 1.37, [idx])
  const select = useOffice(s => s.select)
  const hover = useOffice(s => s.hover)
  const selected = useOffice(s => s.selected)
  const hovered = useOffice(s => s.hovered)
  const focus = useOffice(s => s.focus)
  useOffice(s => s.tick)

  const world = source.world
  const p = world.people[idx]
  const stage = world.wf.stageOf(idx)
  const meta = STAGE_META[stage]
  const dim = !matchesFocus(stage, focus)
  const showName = selected === idx || hovered === idx
  const napping = !p.path.length && p.act === 'nap'

  useFrame((state, dt) => {
    const r = rig.current
    if (!r.root) return
    const pp = world.people[idx]
    const present = world.isPresent(pp)
    r.root.visible = present
    if (!present) return
    const k = 1 - Math.exp(-dt * 12)
    const t = state.clock.elapsedTime + phase
    const walking = pp.path.length > 0
    let pose: Pose = 'stand'
    if (walking) pose = 'walk'
    else if (pp.place === 'wc' || pp.place === 'parking') pose = 'stand'
    else if (pp.act === 'nap') pose = pp.place === 'sofa' ? 'sofaNap' : 'deskNap'
    else if (pp.act === 'eat') pose = 'eat'
    else if (pp.act === 'work') pose = 'type'
    else if (pp.act === 'standup' || pp.act === 'sprint') pose = 'sitIdle'

    r.root.position.x = pp.pos.x
    r.root.position.z = pp.pos.z
    r.root.rotation.y = dampAngle(r.root.rotation.y, pp.heading, walking ? k : 1 - Math.exp(-dt * 6))
    const sitting = pose !== 'walk' && pose !== 'stand'
    const bob = pose === 'walk' ? Math.abs(Math.sin(t * 9)) * 0.035 : 0
    r.root.position.y = damp(r.root.position.y, (pose === 'sofaNap' ? -0.06 : 0) + bob, k)

    const legT = sitting ? -1.45 : pose === 'walk' ? Math.sin(t * 9) * 0.6 : 0
    r.hipL!.rotation.x = damp(r.hipL!.rotation.x, legT, k)
    r.hipR!.rotation.x = damp(r.hipR!.rotation.x, sitting ? -1.45 : pose === 'walk' ? -Math.sin(t * 9) * 0.6 : 0, k)

    let lean = 0, armL = 0, armR = 0, headX = 0, headZ = 0, headY = 0
    switch (pose) {
      case 'walk': armL = -Math.sin(t * 9) * 0.5; armR = Math.sin(t * 9) * 0.5; break
      case 'type': lean = 0.1; armL = -1.15 + Math.sin(t * 14) * 0.06; armR = -1.15 + Math.cos(t * 13) * 0.06; headX = 0.12; break
      case 'deskNap': lean = 0.8; armL = -1.7; armR = -1.7; headX = 0.35; headZ = 0.25; break
      case 'sofaNap': lean = -0.3; armL = -0.2; armR = -0.2; headZ = 0.35; headX = -0.1; break
      case 'eat': lean = 0.08; armL = -0.9; armR = -1.2 - Math.max(0, Math.sin(t * 2.2)) * 0.9; headX = 0.1; break
      case 'sitIdle': armL = -0.55; armR = -0.55 + Math.max(0, Math.sin(t * 1.3)) * -0.4; headY = Math.sin(t * 0.7) * 0.35; break
      case 'stand': armL = 0; armR = 0; headY = Math.sin(t * 0.5) * 0.2; break
    }
    r.upper!.rotation.x = damp(r.upper!.rotation.x, lean, k)
    r.armL!.rotation.x = damp(r.armL!.rotation.x, armL, k)
    r.armR!.rotation.x = damp(r.armR!.rotation.x, armR, k)
    r.head!.rotation.x = damp(r.head!.rotation.x, headX, k)
    r.head!.rotation.z = damp(r.head!.rotation.z, headZ, k)
    r.head!.rotation.y = damp(r.head!.rotation.y, headY, k)

    const sel = useOffice.getState()
    if (r.ring) {
      r.ring.visible = sel.selected === idx || sel.hovered === idx
      r.ring.rotation.z += dt * 0.8
    }
  })

  // focus dimming
  for (const m of Object.values(mats)) {
    m.transparent = dim
    m.opacity = dim ? 0.22 : 1
    m.depthWrite = !dim
  }

  const onDown = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); select(selected === idx ? null : idx) }
  const onOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); hover(idx); document.body.style.cursor = 'pointer' }
  const onOut = () => { hover(null); document.body.style.cursor = '' }

  const r = rig.current
  return (
    <group ref={el => { r.root = el }} onPointerDown={onDown} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh ref={el => { r.ring = el }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={mat('#2FD3E6', { emissive: '#2FD3E6', ei: 2 })} visible={false}>
        <torusGeometry args={[0.42, 0.025, 6, 40, Math.PI * 1.6]} />
      </mesh>
      {/* legs */}
      {[-0.09, 0.09].map((x, i) => (
        <group key={x} position={[x, 0.52, 0]} ref={el => { if (i === 0) r.hipL = el; else r.hipR = el }}>
          <mesh position={[0, -0.23, 0]} castShadow material={mats.pants}><boxGeometry args={[0.14, 0.46, 0.16]} /></mesh>
          <mesh position={[0, -0.48, 0.04]} castShadow material={mats.shoe}><boxGeometry args={[0.15, 0.08, 0.24]} /></mesh>
        </group>
      ))}
      {/* upper body */}
      <group position={[0, 0.52, 0]} ref={el => { r.upper = el }}>
        <RoundedBox args={[0.38, 0.44, 0.26]} radius={0.08} smoothness={3} position={[0, 0.24, 0]} castShadow material={mats.shirt} />
        {[-0.235, 0.235].map((x, i) => (
          <group key={x} position={[x, 0.4, 0]} ref={el => { if (i === 0) r.armL = el; else r.armR = el }}>
            <mesh position={[0, -0.16, 0]} castShadow material={mats.shirt}><boxGeometry args={[0.1, 0.34, 0.12]} /></mesh>
            <mesh position={[0, -0.36, 0]} castShadow material={mats.skin}><sphereGeometry args={[0.055, 10, 8]} /></mesh>
          </group>
        ))}
        <group position={[0, 0.66, 0]} ref={el => { r.head = el }}>
          <mesh position={[0, -0.12, 0]} material={mats.skin}><cylinderGeometry args={[0.06, 0.07, 0.1, 10]} /></mesh>
          <mesh position={[0, 0.04, 0]} castShadow material={mats.skin}><sphereGeometry args={[0.21, 20, 16]} /></mesh>
          <mesh position={[0, 0.07, -0.01]} castShadow material={mats.hair}>
            <sphereGeometry args={[0.222, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          </mesh>
          <mesh position={[0, 0.0, -0.12]} material={mats.hair}><boxGeometry args={[0.4, 0.22, 0.18]} /></mesh>
          {cfg.longHair && <mesh position={[0, -0.14, -0.1]} castShadow material={mats.hair}><boxGeometry args={[0.42, 0.34, 0.16]} /></mesh>}
          {!napping && [-0.075, 0.075].map(x => (
            <mesh key={x} position={[x, 0.04, 0.195]} material={mat('#1D1F22', { rough: 0.3 })}><sphereGeometry args={[0.024, 8, 6]} /></mesh>
          ))}
          {napping && [-0.075, 0.075].map(x => (
            <mesh key={x} position={[x, 0.03, 0.2]} material={mat('#3A2E28')}><boxGeometry args={[0.05, 0.01, 0.01]} /></mesh>
          ))}
          <mesh position={[0, -0.03, 0.2]} material={mat('#D9826E')}><boxGeometry args={[0.05, 0.012, 0.01]} /></mesh>
        </group>
      </group>
      {world.isPresent(p) && <Html position={[0, 1.72, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
        <div className={`chip3d${dim ? ' dim' : ''}${showName ? ' open' : ''}`} style={{ ['--c' as string]: `var(--${meta.token})` }}>
          <span className="ini" style={{ background: cfg.shirt }}>{cfg.name[0]}</span>
          {showName && <span className="nm">{cfg.name}<em>{meta.label}</em></span>}
          {stage === 'blocked' && <i className="bang">!</i>}
          {napping && <i className="zz">z z</i>}
        </div>
      </Html>}
    </group>
  )
}

function Bike({ idx, color }: { idx: number; color: string }) {
  const ref = useRef<THREE.Group>(null)
  const b = BIKE_SPOTS[idx]
  useFrame(() => {
    if (ref.current) ref.current.visible = source.world.people[idx].bikeOn
  })
  return (
    <group ref={ref} position={[b.x, 0, b.z + 0.45]} visible={false}>
      {[-0.42, 0.42].map(z => (
        <mesh key={z} position={[0, 0.24, z]} rotation={[0, Math.PI / 2, 0]} castShadow material={mat('#16191C', { rough: 0.7 })}>
          <torusGeometry args={[0.19, 0.06, 6, 16]} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]} castShadow material={mat(color, { rough: 0.35, metal: 0.3 })}><boxGeometry args={[0.3, 0.32, 1.0]} /></mesh>
      <mesh position={[0, 0.66, -0.12]} castShadow material={mat('#22262B', { rough: 0.6 })}><boxGeometry args={[0.26, 0.08, 0.5]} /></mesh>
      <mesh position={[0, 0.8, 0.42]} material={mat('#3B4046', { metal: 0.6, rough: 0.3 })}><boxGeometry args={[0.6, 0.04, 0.04]} /></mesh>
    </group>
  )
}

export function People() {
  const team = source.world.team
  return (
    <group>
      {team.map((cfg, i) => <Person key={cfg.id} idx={i} cfg={cfg} />)}
      {team.map((cfg, i) => <Bike key={cfg.id} idx={i} color={cfg.shirt} />)}
    </group>
  )
}
