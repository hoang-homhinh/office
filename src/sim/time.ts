export const DAY_MIN = 1440

/** Minutes since midnight → "HH:MM" (wraps at 24h, floors fractions). */
export function hhmm(min: number): string {
  const m = ((Math.floor(min) % DAY_MIN) + DAY_MIN) % DAY_MIN
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function fmtDuration(min: number): string {
  const m = Math.max(0, Math.floor(min))
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)}g ${String(m % 60).padStart(2, '0')}p`
}
