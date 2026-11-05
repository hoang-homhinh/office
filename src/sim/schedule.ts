import { SCHEDULE as S } from '../config/schedule'
import type { Rng } from './rng'
import type { Activity, PersonConfig, PlaceKey } from './types'

export interface DayPlan {
  arrive: number
  leave: number
  lunchStart: number
  lunchEnd: number
  napEnd: number
  /** sofa spot index for lunch nap, -1 = nap at desk */
  sofa: number
  sprint: boolean
  wc: number[]
  overtime: boolean
}

export interface Want { place: PlaceKey; act: Activity }

/** Builds today's timetable for every person, with jitter around the company schedule. */
export function genDay(rng: Rng, team: readonly PersonConfig[]): DayPlan[] {
  const idx = team.map((_, i) => i)
  const overtime = new Set(rng.shuffle(idx).slice(0, S.overtimeCount))
  const sprint = new Set(rng.shuffle(idx).slice(0, S.sprintMeetingSize))
  const nappers = rng.shuffle(idx).slice(0, S.sofaNappers)
  const late = rng.pick(idx)
  return idx.map(i => {
    const lunchStart = rng.range(...S.lunchStart)
    return {
      arrive: i === late ? rng.range(...S.lateArrive) : rng.range(...S.arrive),
      leave: overtime.has(i) ? rng.range(...S.overtime) : rng.range(...S.leave),
      lunchStart,
      lunchEnd: lunchStart + rng.range(...S.lunchLen),
      napEnd: rng.range(...S.napEnd),
      sofa: nappers.indexOf(i),
      sprint: sprint.has(i),
      wc: [rng.range(...S.wcMorning), rng.range(...S.wcAfternoon)],
      overtime: overtime.has(i),
    }
  })
}

/** Where a person should be at minute t. Priority: home > standup > lunch > nap > sprint > wc > desk. */
export function want(p: DayPlan, t: number): Want {
  if (t < p.arrive || t >= p.leave) return { place: 'home', act: 'home' }
  if (t >= S.standup[0] && t < S.standup[1]) return { place: 'meet', act: 'standup' }
  if (t >= p.lunchStart && t < p.lunchEnd) return { place: 'pantry', act: 'eat' }
  if (t >= p.lunchEnd && t < p.napEnd) return p.sofa >= 0 ? { place: 'sofa', act: 'nap' } : { place: 'seat', act: 'nap' }
  if (p.sprint && t >= S.sprintMeeting[0] && t < S.sprintMeeting[1]) return { place: 'meet', act: 'sprint' }
  for (const w of p.wc) if (t >= w && t < w + S.wcLen) return { place: 'wc', act: 'wc' }
  return { place: 'seat', act: 'work' }
}
