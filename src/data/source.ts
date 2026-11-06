import type { World } from '../sim/world'

/**
 * Where office data comes from. Phase 1: MockSource (simulated World).
 * Phase 2: a source that feeds real Git/tracker events into the same World-shaped state.
 */
export interface DataSource {
  readonly world: World
  readonly kind: 'mock' | 'live'
  /** advance by real seconds at the given speed multiplier */
  tick(realDt: number, speed: number): void
  jump(t: number): void
}
