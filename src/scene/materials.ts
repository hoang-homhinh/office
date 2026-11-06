import * as THREE from 'three'

export interface MatOpts {
  rough?: number
  metal?: number
  emissive?: string
  ei?: number
  opacity?: number
  map?: THREE.Texture
  flat?: boolean
}

const cache = new Map<string, THREE.MeshStandardMaterial>()

/** Shared standard material (cached by parameters). Do not mutate the result. */
export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = [color, o.rough, o.metal, o.emissive, o.ei, o.opacity, o.map?.uuid, o.flat].join('|')
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.75,
      metalness: o.metal ?? 0,
      emissive: o.emissive ?? '#000000',
      emissiveIntensity: o.ei ?? 1,
      map: o.map ?? null,
      flatShading: o.flat ?? false,
    })
    if (o.opacity !== undefined && o.opacity < 1) {
      m.transparent = true
      m.opacity = o.opacity
      m.depthWrite = false
      m.side = THREE.DoubleSide
    }
    cache.set(key, m)
  }
  return m
}

export const PALETTE = {
  wallWhite: '#ECEEF1',
  wallTrim: '#C9CFD6',
  frame: '#2E3742',
  glass: '#B9DCEB',
  deskTop: '#F3F1EC',
  oak: '#C79B6B',
  walnut: '#5B4030',
  metal: '#9AA4AE',
  darkMetal: '#3A424C',
  chair: '#2F3640',
  screenOff: '#14181D',
  bezel: '#1B1F25',
  fabricTeal: '#3E8C83',
  fabricBlue: '#47628C',
  fabricRust: '#C0674A',
  plant: '#4E9150',
  plant2: '#6DB062',
  pot: '#E9E5DD',
  grass: '#86AE6C',
  grassDark: '#6F9858',
  asphalt: '#3B4048',
  sidewalk: '#CFCBC3',
  pavers: '#D8CDB8',
  trunk: '#7A5A3C',
  leaf: '#5E9E4E',
  leaf2: '#78B35C',
  leaf3: '#4C8A45',
}
