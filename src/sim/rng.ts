/** Deterministic PRNG (mulberry32) so simulations and demos are repeatable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private readonly gen: () => number
  constructor(seed: number) {
    this.gen = mulberry32(seed)
  }
  next(): number {
    return this.gen()
  }
  range(a: number, b: number): number {
    return a + this.gen() * (b - a)
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1))
  }
  chance(p: number): boolean {
    return this.gen() < p
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.gen() * arr.length)]
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.gen() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
}
