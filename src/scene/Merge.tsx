import { useLayoutEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Merges every static, non-instanced mesh under it into one mesh per (material, shadow flags).
 * Cuts draw calls by an order of magnitude. Children must not move after mount.
 * Shared dynamic materials (emissive changes) keep working because the material object is reused.
 */
export function Merge({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    root.updateWorldMatrix(true, true)
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert()
    const buckets = new Map<string, { material: THREE.Material; cast: boolean; receive: boolean; geos: THREE.BufferGeometry[] }>()
    const sources: THREE.Mesh[] = []
    root.traverse(o => {
      const m = o as THREE.Mesh
      if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || Array.isArray(m.material) || m.userData.merged) return
      const g = m.geometry.index ? m.geometry.clone() : m.geometry.clone()
      if (!g.index) return
      const local = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)
      g.applyMatrix4(local)
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
      const key = `${m.material.uuid}|${m.castShadow}|${m.receiveShadow}`
      let b = buckets.get(key)
      if (!b) { b = { material: m.material, cast: m.castShadow, receive: m.receiveShadow, geos: [] }; buckets.set(key, b) }
      b.geos.push(g)
      sources.push(m)
    })
    const merged: THREE.Mesh[] = []
    for (const b of buckets.values()) {
      const geo = mergeGeometries(b.geos, false)
      b.geos.forEach(g => g.dispose())
      if (!geo) continue
      const mesh = new THREE.Mesh(geo, b.material)
      mesh.castShadow = b.cast
      mesh.receiveShadow = b.receive
      mesh.userData.merged = true
      merged.push(mesh)
      root.add(mesh)
    }
    sources.forEach(s => { s.visible = false })
    return () => {
      merged.forEach(m => { root.remove(m); m.geometry.dispose() })
      sources.forEach(s => { s.visible = true })
    }
  }, [])
  return <group ref={ref}>{children}</group>
}
