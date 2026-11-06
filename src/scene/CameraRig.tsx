import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type CameraControlsImpl from 'camera-controls'
import { source } from '../data/mockSource'
import { useOffice, type ViewId } from '../store'

interface ViewDef { target: [number, number, number]; dist: number; az?: number; polar?: number }

export const VIEWS: Record<ViewId, ViewDef & { label: string }> = {
  all: { label: 'Toàn cảnh', target: [15, 0, 13.5], dist: 62 },
  building: { label: 'Tòa nhà', target: [15, 0, 10.5], dist: 44 },
  dev: { label: 'Khu Dev', target: [9.5, 0, 5.5], dist: 22 },
  team: { label: 'Cụm team', target: [13.2, 0.5, 8.0], dist: 11.5 },
  meeting: { label: 'Phòng họp', target: [25.2, 0.5, 2.6], dist: 12 },
  pantry: { label: 'Pantry', target: [25.2, 0.5, 8.0], dist: 12 },
  server: { label: 'Phòng server', target: [21.7, 0.5, 16.0], dist: 11 },
  lounge: { label: 'Khu thư giãn', target: [5, 0.5, 16.0], dist: 13 },
  outside: { label: 'Bãi xe & cổng', target: [9, 0, 22.5], dist: 17 },
}

const AZ = 0.42
const POLAR = 0.93

function lookFrom(v: ViewDef): [number, number, number, number, number, number] {
  const az = v.az ?? AZ, polar = v.polar ?? POLAR
  const [tx, ty, tz] = v.target
  return [
    tx + v.dist * Math.sin(polar) * Math.sin(az),
    ty + v.dist * Math.cos(polar),
    tz + v.dist * Math.sin(polar) * Math.cos(az),
    tx, ty, tz,
  ]
}

/** Imperative camera API for the overlay buttons. */
export const camApi = {
  controls: null as CameraControlsImpl | null,
  zoom(f: number) { this.controls?.dolly(f, true) },
  rotate(a: number) { this.controls?.rotate(a, 0, true) },
}

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)
  const view = useOffice(s => s.view)
  const nonce = useOffice(s => s.camNonce)
  const selected = useOffice(s => s.selected)
  const first = useRef(true)
  const size = useThree(s => s.size)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    camApi.controls = c
    // views are framed for a wide stage; back off on tall/narrow screens
    const fit = Math.min(2.4, Math.max(1, 1.75 / (size.width / Math.max(1, size.height))))
    let v: ViewDef = { ...VIEWS[view], dist: VIEWS[view].dist * fit }
    if (selected !== null && !first.current) {
      const p = source.world.people[selected]
      if (source.world.isPresent(p)) v = { target: [p.pos.x, 0.7, p.pos.z], dist: 9 }
    }
    c.setLookAt(...lookFrom(v), !first.current)
    first.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, nonce])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={4}
      maxDistance={110}
      minPolarAngle={0.15}
      maxPolarAngle={1.32}
      dollySpeed={0.6}
      smoothTime={0.35}
    />
  )
}
