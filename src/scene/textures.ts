import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const k = key + (repeat ? repeat.join('x') : '')
  const hit = cache.get(k)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  draw(g)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
  }
  cache.set(k, tex)
  return tex
}

/** Deterministic pseudo-noise so textures look the same on every load. */
function noise(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

/** Light oak planks, one texture tile = 2 m × 2 m. */
export function planks(base: string, rx: number, rz: number) {
  return make('planks' + base, 256, 256, g => {
    const r = noise(7)
    g.fillStyle = base
    g.fillRect(0, 0, 256, 256)
    const rows = 8, h = 256 / rows
    for (let i = 0; i < rows; i++) {
      let x = -r() * 120
      while (x < 256) {
        const len = 90 + r() * 110
        const shade = (r() - 0.5) * 18
        g.fillStyle = `rgba(${shade > 0 ? 255 : 0},${shade > 0 ? 240 : 0},${shade > 0 ? 220 : 0},${Math.abs(shade) / 100})`
        g.fillRect(x, i * h, len, h)
        g.fillStyle = 'rgba(70,45,25,0.18)'
        g.fillRect(x, i * h, 1.5, h)
        x += len
      }
      g.fillStyle = 'rgba(70,45,25,0.22)'
      g.fillRect(0, i * h, 256, 1.2)
    }
  }, [rx / 2, rz / 2])
}

/** Square tiles, one texture tile = 2 × 2 tiles of `size` metres. */
export function tiles(a: string, b: string, grout: string, rx: number, rz: number, size = 0.6) {
  return make(`tiles${a}${b}${grout}${size}`, 128, 128, g => {
    g.fillStyle = grout
    g.fillRect(0, 0, 128, 128)
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? a : b
      g.fillRect(i * 64 + 1.5, j * 64 + 1.5, 61, 61)
    }
  }, [rx / (size * 2), rz / (size * 2)])
}

/** Soft carpet with fibre noise. */
export function carpet(base: string, rx: number, rz: number) {
  return make('carpet' + base, 128, 128, g => {
    const r = noise(3)
    g.fillStyle = base
    g.fillRect(0, 0, 128, 128)
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
      g.fillRect(r() * 128, r() * 128, 1.2, 1.2)
    }
  }, [rx / 2, rz / 2])
}

/** Raised-floor panels for the server room. */
export function raisedFloor(rx: number, rz: number) {
  return make('raised', 128, 128, g => {
    g.fillStyle = '#2A3138'
    g.fillRect(0, 0, 128, 128)
    g.strokeStyle = '#3C4752'
    g.lineWidth = 2
    for (let i = 0; i <= 2; i++) {
      g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 128); g.stroke()
      g.beginPath(); g.moveTo(0, i * 64); g.lineTo(128, i * 64); g.stroke()
    }
    g.fillStyle = 'rgba(255,255,255,0.05)'
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++)
      for (let k = 0; k < 4; k++) for (let l = 0; l < 4; l++) g.fillRect(i * 64 + 10 + k * 13, j * 64 + 10 + l * 13, 5, 5)
  }, [rx / 1.2, rz / 1.2])
}

/** Grass with blade speckles. */
export function grass(rx: number, rz: number) {
  return make('grass', 256, 256, g => {
    const r = noise(11)
    g.fillStyle = '#86AE6C'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 4000; i++) {
      const v = r()
      g.fillStyle = v > 0.66 ? 'rgba(160,200,120,0.35)' : v > 0.33 ? 'rgba(90,130,70,0.3)' : 'rgba(120,165,95,0.3)'
      g.fillRect(r() * 256, r() * 256, 2, 3)
    }
  }, [rx / 6, rz / 6])
}

export function asphalt(rx: number, rz: number) {
  return make('asphalt', 256, 256, g => {
    const r = noise(5)
    g.fillStyle = '#3D424A'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 5000; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'
      g.fillRect(r() * 256, r() * 256, 1.5, 1.5)
    }
  }, [rx / 4, rz / 4])
}

/** Text/logo plate rendered to a texture. */
export function label(text: string, sub: string, bg: string, fg: string, accent: string) {
  return make(`label${text}${sub}${bg}`, 512, 160, g => {
    g.fillStyle = bg
    g.fillRect(0, 0, 512, 160)
    g.fillStyle = accent
    g.fillRect(28, 44, 12, 72)
    g.fillStyle = fg
    g.font = '800 58px "Be Vietnam Pro", "Segoe UI", sans-serif'
    g.textBaseline = 'middle'
    g.fillText(text, 60, 70)
    g.globalAlpha = 0.75
    g.font = '500 26px "Be Vietnam Pro", "Segoe UI", sans-serif'
    g.fillText(sub, 62, 120)
  })
}

/** Wall TV content: a small dashboard look. */
export function tvScreen() {
  return make('tv', 512, 288, g => {
    g.fillStyle = '#0E1A2B'
    g.fillRect(0, 0, 512, 288)
    g.fillStyle = '#5BA8FF'
    g.font = '700 26px "Be Vietnam Pro", "Segoe UI", sans-serif'
    g.fillText('Sprint review', 24, 42)
    const bars = [120, 160, 90, 200, 150, 180, 130]
    bars.forEach((h, i) => {
      g.fillStyle = i % 2 ? '#3CC487' : '#E2A83A'
      g.fillRect(30 + i * 60, 260 - h, 36, h)
    })
    g.strokeStyle = '#A483F2'
    g.lineWidth = 4
    g.beginPath()
    ;[200, 170, 175, 140, 120, 95, 80].forEach((y, i) => (i ? g.lineTo(48 + i * 60, y) : g.moveTo(48, y)))
    g.stroke()
  })
}
