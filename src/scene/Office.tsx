import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import * as THREE from 'three'
import { source } from '../data/mockSource'
import { useOffice } from '../store'
import { Building } from './Building'
import { CameraRig } from './CameraRig'
import { Furniture } from './Furniture'
import { Lighting } from './Lighting'
import { Merge } from './Merge'
import { Outdoors, Traffic } from './Outdoors'
import { People } from './People'
import { RoomLabels } from './RoomLabels'

export const perf = { fps: 0, calls: 0, programs: 0 }

/** Advances the simulation once per rendered frame and measures fps. */
function SimDriver() {
  const acc = useRef({ n: 0, t: 0 })
  useFrame(({ gl }, dt) => {
    const s = useOffice.getState()
    if (!s.paused) source.tick(Math.min(dt, 0.1), s.speed)
    const a = acc.current
    a.n++
    a.t += dt
    if (a.t >= 1) { perf.fps = Math.round(a.n / a.t); a.n = 0; a.t = 0; perf.calls = gl.info.render.calls; perf.programs = gl.info.programs?.length ?? 0 }
    gl.info.reset()
  }, -1)
  return null
}

export function Office({ active }: { active: boolean }) {
  const select = useOffice(s => s.select)
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.5, far: 400, position: [40, 32, 50] }}
      onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.info.autoReset = false }}
      onPointerMissed={() => select(null)}
    >
      <SimDriver />
      <Lighting />
      <Merge>
        <Building />
        <Furniture />
        <Outdoors />
      </Merge>
      <Traffic />
      <People />
      <RoomLabels />
      <CameraRig />
      <EffectComposer multisampling={4}>
        <Bloom intensity={0.55} luminanceThreshold={0.9} luminanceSmoothing={0.15} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.3} darkness={0.45} />
      </EffectComposer>
    </Canvas>
  )
}
