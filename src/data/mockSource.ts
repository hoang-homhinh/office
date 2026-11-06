import { World } from '../sim/world'
import type { DataSource } from './source'

export class MockSource implements DataSource {
  readonly kind = 'mock' as const
  readonly world: World
  constructor(seed?: number) {
    this.world = new World(seed)
  }
  tick(realDt: number, speed: number) {
    this.world.advance(realDt, speed)
  }
  jump(t: number) {
    this.world.setTime(t)
  }
}

export const source: DataSource = new MockSource()
