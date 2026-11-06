import { TEAM } from '../config/team'
import { SCHEDULE } from '../config/schedule'
import { Rng } from './rng'
import { genDay, want, type DayPlan } from './schedule'
import { placeSpot, route } from './nav'
import { Workflow, type GitEvent } from './workflow'
import { DAY_MIN } from './time'
import type { Activity, DisplayStage, PersonConfig, PlaceKey, Vec2 } from './types'

export interface PersonState {
  idx: number
  cfg: PersonConfig
  pos: Vec2
  /** rotation around Y; 0 = facing +z */
  heading: number
  place: PlaceKey
  dest: PlaceKey
  path: Vec2[]
  act: Activity
  bikeOn: boolean
  leaving: boolean
}

export interface ReviewItem { idx: number; pr: number; ticket: string; title: string; reviewer: number; waiting: number }

export interface WorldStats {
  present: number
  counts: Record<DisplayStage, number>
  reviewQueue: ReviewItem[]
  sprint: { name: string; total: number; done: number; remaining: number; dayOfSprint: number; sprintDays: number }
  burndown: number[]
  today: { merged: number; deploys: number; ciFails: number; qaPass: number; qaFail: number; commits: number }
  lastDeployAt: number | null
  pipelineBusy: boolean
  ciFailRecent: boolean
}

const START_T = 455
const SPRINT_DAYS = 10
const WALK_M_PER_SIM_MIN = 2
const headingOf = (face: number) => (face === 1 ? 0 : Math.PI)

export class World {
  readonly seed: number
  readonly team = TEAM
  t!: number
  day!: number
  people!: PersonState[]
  events!: GitEvent[]
  wf!: Workflow
  private rng!: Rng
  private plans!: DayPlan[]
  private evAcc!: number
  private today!: { merged: number; deploys: number; ciFails: number; qaPass: number; qaFail: number; commits: number }
  private lastDeployAt!: number | null
  private lastPipelineAt!: number
  private lastCiFailAt!: number
  private burn!: number[]
  /** bumps whenever events change, so UIs can memoise */
  version = 0

  constructor(seed = 20261106) {
    this.seed = seed
    this.init()
  }

  /** (Re)initialises the deterministic state for this seed: day 1, 07:35. */
  private init(): void {
    this.t = START_T
    this.day = 1
    this.events = []
    this.evAcc = 0
    this.today = { merged: 0, deploys: 0, ciFails: 0, qaPass: 0, qaFail: 0, commits: 0 }
    this.lastDeployAt = null
    this.lastPipelineAt = -999
    this.lastCiFailAt = -999
    this.rng = new Rng(this.seed)
    this.plans = genDay(this.rng, TEAM)
    this.wf = new Workflow(TEAM, new Rng(this.seed ^ 0x9e3779b9), START_T)
    this.burn = [26, 25, 23, 22, 21, 19]
    this.people = TEAM.map((cfg, idx) => ({
      idx, cfg, pos: { x: 0, z: 0 }, heading: 0, place: 'home', dest: 'home', path: [], act: 'home', bikeOn: false, leaving: false,
    }))
    this.version++
  }

  plansFor(i: number): DayPlan {
    return this.plans[i]
  }

  /** Advance by `realDt` seconds of wall time at `speed` (1× = 2 sim minutes per second). */
  advance(realDt: number, speed: number): void {
    let left = realDt
    while (left > 1e-9) {
      const dt = Math.min(0.05, left)
      left -= dt
      this.stepTime(dt * speed * 2)
      this.movePeople(dt, speed)
    }
  }

  private stepTime(dm: number) {
    this.t += dm
    if (this.t >= DAY_MIN) this.newDay()
    this.evAcc += dm
    while (this.evAcc >= SCHEDULE.eventEveryMin) {
      this.evAcc -= SCHEDULE.eventEveryMin
      if (this.t >= SCHEDULE.eventsFrom && this.t < SCHEDULE.eventsUntil) this.tickEvent()
    }
  }

  private newDay() {
    this.t -= DAY_MIN
    this.day++
    this.wf.day = this.day
    this.plans = genDay(this.rng, TEAM)
    this.burn.push(this.wf.sprint.total - this.wf.sprint.done)
    if (this.burn.length >= SPRINT_DAYS) {
      this.burn = []
      this.wf.sprint = { name: `Sprint ${Number(this.wf.sprint.name.split(' ')[1]) + 1}`, total: 24, done: 0 }
    }
    this.today = { merged: 0, deploys: 0, ciFails: 0, qaPass: 0, qaFail: 0, commits: 0 }
  }

  private tickEvent() {
    const cands = this.people.filter(p => p.place === 'seat' && !p.path.length && p.act === 'work' && this.wf.canAct(p.idx))
    if (!cands.length) return
    const w = cands.map(p => {
      const tk = this.wf.tasks[p.idx]
      const age = tk ? this.t - tk.since : 30
      return 1 + Math.min(Math.max(age, 0), 240) / 50 * (tk?.blocked ? 0.4 : 1)
    })
    let s = w.reduce((a, b) => a + b, 0) * this.rng.next()
    let chosen = cands[cands.length - 1]
    for (let k = 0; k < cands.length; k++) { s -= w[k]; if (s <= 0) { chosen = cands[k]; break } }
    const evs = this.wf.step(chosen.idx, this.t, this.rng.next())
    for (const e of evs) this.record(e)
  }

  private record(e: GitEvent) {
    this.events.push(e)
    if (this.events.length > 400) this.events.splice(0, this.events.length - 400)
    this.version++
    switch (e.kind) {
      case 'commit': this.today.commits += e.commits ?? 1; break
      case 'pr_opened': this.lastPipelineAt = e.at; break
      case 'ci_failed': this.today.ciFails++; this.lastCiFailAt = e.at; break
      case 'merged': this.today.merged++; this.lastPipelineAt = e.at; break
      case 'deployed_staging': this.today.deploys++; this.lastDeployAt = e.at; break
      case 'qa_pass': this.today.qaPass++; break
      case 'qa_fail': this.today.qaFail++; break
    }
  }

  private movePeople(dt: number, speed: number) {
    // metres per real second: 2 m per sim-minute keeps a 20 m walk at ~10 sim-minutes at any speed
    const walk = Math.max(3, speed * 2 * WALK_M_PER_SIM_MIN)
    for (const p of this.people) {
      if (p.path.length) {
        let v = walk * dt
        while (v > 0 && p.path.length) {
          const tg = p.path[0], dx = tg.x - p.pos.x, dz = tg.z - p.pos.z, d = Math.hypot(dx, dz)
          if (d > 1e-6) p.heading = Math.atan2(dx, dz)
          if (d <= v) {
            p.pos = { x: tg.x, z: tg.z }
            p.path.shift()
            v -= d
            if (!p.path.length) this.arrive(p)
          } else {
            p.pos = { x: p.pos.x + (dx / d) * v, z: p.pos.z + (dz / d) * v }
            v = 0
          }
        }
        continue
      }
      const w = want(this.plans[p.idx], this.t)
      if (w.place !== p.place) this.startRoute(p, w.place)
      else p.act = w.act
    }
  }

  private startRoute(p: PersonState, to: PlaceKey) {
    const plan = this.plans[p.idx]
    if (p.place === 'home') {
      const s = placeSpot(p.idx, 'parking', plan)
      p.pos = { x: s.x, z: s.z }
      p.bikeOn = true
      p.place = 'parking'
    }
    if (to === 'home') { to = 'parking'; p.leaving = true }
    if (to === p.place) { if (p.leaving) this.arrive(p); return }
    p.path = route(p.idx, plan, p.place, to)
    p.dest = to
  }

  private arrive(p: PersonState) {
    p.place = p.dest
    if (p.leaving && p.place === 'parking') {
      p.place = 'home'; p.dest = 'home'; p.bikeOn = false; p.leaving = false; p.act = 'home'
      return
    }
    p.heading = headingOf(placeSpot(p.idx, p.place, this.plans[p.idx]).face)
  }

  /**
   * Jump the clock; everyone appears where their schedule says, without walking.
   * Jumping forward within the same day fast-forwards the work so events and stats stay realistic.
   */
  setTime(t: number): void {
    const target = ((t % DAY_MIN) + DAY_MIN) % DAY_MIN
    const day = this.day
    // going back in time: replay deterministically from the seed (cheap: ~360 steps per day)
    if (target < this.t) this.init()
    while (this.day < day || this.t < target - 1e-6) {
      const end = this.day < day ? DAY_MIN : target
      this.stepTime(Math.min(SCHEDULE.eventEveryMin, end - this.t))
      this.snapPeople()
    }
    this.t = target
    this.snapPeople()
  }

  private snapPeople(): void {
    for (const p of this.people) {
      const w = want(this.plans[p.idx], this.t)
      p.path = []
      p.leaving = false
      if (w.place === 'home') {
        Object.assign(p, { place: 'home', dest: 'home', bikeOn: false, act: 'home' })
        continue
      }
      const s = placeSpot(p.idx, w.place, this.plans[p.idx])
      Object.assign(p, { place: w.place, dest: w.place, pos: { x: s.x, z: s.z }, heading: headingOf(s.face), bikeOn: true, act: w.act })
    }
  }

  isPresent(p: PersonState): boolean {
    return p.place !== 'home' || p.path.length > 0
  }

  stats(): WorldStats {
    const counts: Record<DisplayStage, number> = { doing: 0, review: 0, qa: 0, done: 0, blocked: 0, test: 0, testidle: 0 }
    this.people.forEach(p => counts[this.wf.stageOf(p.idx)]++)
    const reviewQueue: ReviewItem[] = []
    this.wf.tasks.forEach((tk, idx) => {
      if (tk && tk.stage === 'review' && tk.pr !== null && tk.reviewer !== null)
        reviewQueue.push({ idx, pr: tk.pr, ticket: tk.key, title: tk.title, reviewer: tk.reviewer, waiting: Math.max(0, this.t - (tk.prOpenedAt ?? tk.since)) })
    })
    reviewQueue.sort((a, b) => b.waiting - a.waiting)
    const sp = this.wf.sprint
    return {
      present: this.people.filter(p => this.isPresent(p)).length,
      counts,
      reviewQueue,
      sprint: { ...sp, remaining: sp.total - sp.done, dayOfSprint: this.burn.length + 1, sprintDays: SPRINT_DAYS },
      burndown: [...this.burn, sp.total - sp.done],
      today: { ...this.today },
      lastDeployAt: this.lastDeployAt,
      pipelineBusy: this.t - this.lastPipelineAt >= 0 && this.t - this.lastPipelineAt < 12,
      ciFailRecent: this.t - this.lastCiFailAt >= 0 && this.t - this.lastCiFailAt < 15,
    }
  }
}
