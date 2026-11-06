import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { source } from '../data/mockSource'
import type { PlaceKey } from '../sim/types'
import { getDyn } from './dynamic'
import { LAMP_X } from './Outdoors'
import { skyAt } from './sky'

const CENTER = new THREE.Vector3(15, 0, 12)

interface RoomLight { pos: [number, number, number]; color: string; max: number; dist: number; when: (occ: Record<string, number>, anyone: boolean) => boolean }
const ROOM_LIGHTS: RoomLight[] = [
  { pos: [13.2, 2.4, 8.0], color: '#FFE3B5', max: 9, dist: 9, when: o => o.seat > 0 },
  { pos: [6.0, 2.4, 5.0], color: '#FFE3B5', max: 4, dist: 9, when: (o, a) => a && o.seat > 0 },
  { pos: [25.2, 2.3, 2.5], color: '#FFE6C2', max: 8, dist: 7, when: o => o.meet > 0 },
  { pos: [25.2, 2.3, 8.2], color: '#FFE0B0', max: 8, dist: 7, when: o => o.pantry > 0 },
  { pos: [4.8, 2.3, 16.0], color: '#FFD9A6', max: 7, dist: 7, when: o => o.sofa > 0 },
  { pos: [14.5, 2.3, 16.0], color: '#FFE3B5', max: 6, dist: 8, when: (_, a) => a },
  { pos: [21.7, 2.2, 16.0], color: '#7FE6FF', max: 5, dist: 6, when: () => true },
  { pos: [27.2, 2.2, 16.2], color: '#EAF4FF', max: 4, dist: 5, when: o => o.wc > 0 },
]

export function Lighting() {
  const { scene } = useThree()
  const sun = useRef<THREE.DirectionalLight>(null)
  const moon = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const rooms = useRef<(THREE.PointLight | null)[]>([])
  const lamps = useRef<(THREE.PointLight | null)[]>([])
  const bg = useMemo(() => new THREE.Color(), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    scene.background = bg
    scene.fog = new THREE.Fog(bg.getHex(), 70, 170)
    if (sun.current) { sun.current.target.position.copy(CENTER); scene.add(sun.current.target) }
    if (moon.current) { moon.current.target.position.copy(CENTER); scene.add(moon.current.target) }
  }, [scene, bg])

  useFrame((_, dt) => {
    const w = source.world
    const s = skyAt(w.t)
    const k = 1 - Math.exp(-dt * 4)
    bg.set(s.bg)
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(bg)
    if (sun.current) {
      sun.current.position.set(CENTER.x + s.sunDir[0] * 60, s.sunDir[1] * 60, CENTER.z + s.sunDir[2] * 60)
      sun.current.color.set(s.sunColor)
      sun.current.intensity = s.sunIntensity
      sun.current.castShadow = s.sunIntensity > 0.05
    }
    if (moon.current) moon.current.intensity = s.moonIntensity
    if (hemi.current) {
      hemi.current.color.set(s.hemiSky)
      hemi.current.groundColor.set(s.hemiGround)
      hemi.current.intensity = s.hemiIntensity
    }
    // occupancy
    const occ: Record<PlaceKey, number> = { home: 0, seat: 0, meet: 0, pantry: 0, sofa: 0, wc: 0, parking: 0 }
    let anyone = false
    for (const p of w.people) {
      if (w.isPresent(p)) anyone = true
      if (!p.path.length) occ[p.place]++
      else occ[p.dest]++
    }
    ROOM_LIGHTS.forEach((r, i) => {
      const l = rooms.current[i]
      if (!l) return
      const target = r.when(occ, anyone) ? r.max * (0.15 + 0.85 * s.night) : 0
      l.intensity = l.intensity + (target - l.intensity) * k
      l.visible = l.intensity > 0.02
    })
    lamps.current.forEach(l => { if (l) { l.intensity = 14 * s.night; l.visible = s.night > 0.05 } })

    // emissive props
    const d = getDyn()
    const st = w.stats()
    w.people.forEach((p, i) => {
      const m = d.teamScreens[i]
      const on = p.place === 'seat' && !p.path.length && (p.act === 'work')
      const dimOn = p.place === 'seat' && !p.path.length && p.act === 'nap'
      m.emissiveIntensity += ((on ? 1.25 : dimOn ? 0.15 : 0) - m.emissiveIntensity) * k
    })
    const deskLights = occ.seat > 0 ? 0.6 + 2.2 * s.night : 0.12
    d.pendantTeam.emissiveIntensity += (deskLights - d.pendantTeam.emissiveIntensity) * k
    d.pendantOther.emissiveIntensity += ((anyone ? 0.3 + 0.8 * s.night : 0.08) - d.pendantOther.emissiveIntensity) * k
    d.tv.emissiveIntensity += ((occ.meet > 0 ? 1.1 : 0) - d.tv.emissiveIntensity) * k
    const t = performance.now() / 1000
    const fast = st.pipelineBusy ? 9 : 2.2
    d.rackLed.emissiveIntensity = 1.2 + Math.sin(t * fast) * 0.9
    d.rackLed.emissive.copy(tmp.set(st.ciFailRecent && Math.sin(t * 6) > 0 ? '#FF4B4B' : '#2FD3E6'))
    d.rackLed.color.copy(d.rackLed.emissive)
    d.rackLedAlt.emissiveIntensity = 1.0 + Math.cos(t * fast * 1.3) * 0.8
    d.lamp.emissiveIntensity = 0.2 + 4 * s.night
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#e2effa', '#8d917c', 1]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.4}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      <directionalLight ref={moon} position={[CENTER.x - 30, 50, CENTER.z + 20]} color="#9BB4FF" intensity={0} />
      {ROOM_LIGHTS.map((r, i) => (
        <pointLight key={i} ref={el => { rooms.current[i] = el }} position={r.pos} color={r.color} intensity={0} distance={r.dist} decay={1.6} />
      ))}
      {LAMP_X.map((x, i) => (
        <pointLight key={x} ref={el => { lamps.current[i] = el }} position={[x, 3.5, 26]} color="#FFD58A" intensity={0} distance={11} decay={1.5} />
      ))}
    </>
  )
}
