import type { Material } from 'three'
import { mat, type MatOpts } from './materials'

interface BlockProps {
  /** min corner on the floor plan */
  x: number
  z: number
  w: number
  d: number
  h: number
  /** bottom height */
  y?: number
  color?: string
  m?: MatOpts
  material?: Material
  cast?: boolean
  receive?: boolean
}

/** Axis-aligned box placed by its min corner (x, y, z) and size — matches the floor-plan coordinates. */
export function Block({ x, z, w, d, h, y = 0, color = '#cccccc', m, material, cast = true, receive = true }: BlockProps) {
  return (
    <mesh position={[x + w / 2, y + h / 2, z + d / 2]} castShadow={cast} receiveShadow={receive} material={material ?? mat(color, m)}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  )
}

/** Cylinder standing on the floor at centre (x, z). */
export function Cyl({ x, z, r, h, y = 0, color = '#cccccc', m, seg = 16, r2 }: { x: number; z: number; r: number; h: number; y?: number; color?: string; m?: MatOpts; seg?: number; r2?: number }) {
  return (
    <mesh position={[x, y + h / 2, z]} castShadow receiveShadow material={mat(color, m)}>
      <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    </mesh>
  )
}

/** Potted plant: pot + layered low-poly foliage. */
export function Plant({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow material={mat('#E9E5DD', { rough: 0.5 })}>
        <cylinderGeometry args={[0.2, 0.15, 0.44, 14]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow material={mat('#4E9150', { flat: true })}>
        <icosahedronGeometry args={[0.3, 0]} />
      </mesh>
      <mesh position={[0.12, 0.85, 0.05]} castShadow material={mat('#6DB062', { flat: true })}>
        <icosahedronGeometry args={[0.22, 0]} />
      </mesh>
      <mesh position={[-0.1, 0.8, -0.08]} castShadow material={mat('#5A9F55', { flat: true })}>
        <icosahedronGeometry args={[0.2, 0]} />
      </mesh>
    </group>
  )
}
