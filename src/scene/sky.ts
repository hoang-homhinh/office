/** Pure day/night model: everything the lighting needs for a given minute of day. */
export interface Sky {
  /** 0 = full day, 1 = full night */
  night: number
  /** 0..1 golden-hour amount */
  warm: number
  sunDir: [number, number, number]
  sunColor: string
  sunIntensity: number
  moonIntensity: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  bg: string
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
function hex(c: number[]): string {
  return '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}
function parse(h: string): number[] {
  const n = parseInt(h.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
export function mixHex(a: string, b: string, t: number): string {
  const A = parse(a), B = parse(b)
  return hex(A.map((v, i) => v + (B[i] - v) * t))
}

export function skyAt(min: number): Sky {
  const h = (((min % 1440) + 1440) % 1440) / 60
  let night: number
  if (h < 5.3) night = 1
  else if (h < 6.8) night = 1 - (h - 5.3) / 1.5
  else if (h < 17.6) night = 0
  else if (h < 19.2) night = (h - 17.6) / 1.6
  else night = 1
  night = clamp01(night)

  let warm = 0
  if (h >= 15.8 && h < 19.2) warm = h < 17.8 ? (h - 15.8) / 2 : 1 - (h - 17.8) / 1.4
  if (h >= 5.3 && h < 7.8) warm = Math.max(warm, 1 - Math.abs(h - 6.4) / 1.4)
  warm = clamp01(warm)

  // sun travels east (+x) → west (−x) between 06:00 and 18:00, slightly toward the camera (+z)
  const a = ((h - 6) / 12) * Math.PI
  const raw = [Math.cos(a), Math.max(0.08, Math.sin(a)), 0.45]
  const len = Math.hypot(raw[0], raw[1], raw[2])
  const sunDir: [number, number, number] = [raw[0] / len, raw[1] / len, raw[2] / len]

  const day = 1 - night
  return {
    night,
    warm,
    sunDir,
    sunColor: mixHex('#fff3df', '#ff9d52', warm * 0.85),
    sunIntensity: night >= 1 ? 0 : 2.6 * day * (1 - warm * 0.35),
    moonIntensity: 0.45 * night,
    hemiSky: mixHex(mixHex('#e2effa', '#f5d2b0', warm * 0.6), '#22345c', night),
    hemiGround: mixHex('#8d917c', '#0d1220', night),
    hemiIntensity: 0.55 + 0.45 * day,
    bg: mixHex(mixHex('#bcd8e6', '#f0c39a', warm * 0.75), '#080f22', night),
  }
}

export function phaseOf(min: number): string {
  const h = (((min % 1440) + 1440) % 1440) / 60
  if (h < 5.5) return 'Đêm'
  if (h < 7.5) return 'Sáng sớm'
  if (h < 8.5) return 'Giờ vào làm'
  if (h < 8.75) return 'Họp standup'
  if (h < 12) return 'Làm buổi sáng'
  if (h < 13.5) return 'Nghỉ trưa'
  if (h < 17.5) return 'Làm buổi chiều'
  if (h < 19) return 'Tan làm'
  if (h < 22) return 'Buổi tối'
  return 'Đêm'
}
