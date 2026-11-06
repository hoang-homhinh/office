import * as THREE from 'three'
import { tvScreen } from './textures'

/**
 * Materials whose emissive state changes with time / occupancy.
 * Created lazily (textures need the DOM) and mutated each frame by <Dynamics />.
 */
let dyn: ReturnType<typeof create> | null = null

function create() {
  const emissive = (color: string, ei = 0) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: ei, roughness: 0.4 })
  const tvTex = tvScreen()
  return {
    teamScreens: Array.from({ length: 10 }, () => new THREE.MeshStandardMaterial({ color: '#0F141A', emissive: '#6FB6FF', emissiveIntensity: 0, roughness: 0.3 })),
    idleScreen: new THREE.MeshStandardMaterial({ color: '#12171D', roughness: 0.25, metalness: 0.2 }),
    pendantTeam: emissive('#FFF1D6', 0.2),
    pendantOther: emissive('#FFF1D6', 0.1),
    tv: new THREE.MeshStandardMaterial({ color: '#0B0F14', map: tvTex, emissive: '#ffffff', emissiveMap: tvTex, emissiveIntensity: 0, roughness: 0.3 }),
    rackLed: emissive('#2FD3E6', 1.5),
    rackLedAlt: emissive('#3CE08A', 1.2),
    lamp: emissive('#FFE2A8', 0.2),
    windowGlow: emissive('#FFD9A0', 0),
  }
}

export function getDyn() {
  if (!dyn) dyn = create()
  return dyn
}
