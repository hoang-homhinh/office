import { create } from 'zustand'
import type { DisplayStage } from './sim/types'

export type ViewId = 'all' | 'building' | 'dev' | 'team' | 'meeting' | 'pantry' | 'server' | 'lounge' | 'outside'
export type ThemePref = 'system' | 'light' | 'dark'
export type Tab = 'office' | 'timeline'
export type FocusKey = Exclude<DisplayStage, 'testidle' | 'test'> | null

interface OfficeState {
  speed: number
  paused: boolean
  selected: number | null
  hovered: number | null
  focus: FocusKey
  view: ViewId
  /** bumps when the camera should fly to `view` / selected person */
  camNonce: number
  theme: ThemePref
  tab: Tab
  /** UI refresh counter (≈4 Hz) */
  tick: number
  setSpeed: (s: number) => void
  togglePause: () => void
  select: (i: number | null, fly?: boolean) => void
  hover: (i: number | null) => void
  setFocus: (f: FocusKey) => void
  setView: (v: ViewId) => void
  setTheme: (t: ThemePref) => void
  setTab: (t: Tab) => void
  bump: () => void
}

export const useOffice = create<OfficeState>(set => ({
  speed: 4,
  paused: false,
  selected: null,
  hovered: null,
  focus: null,
  view: 'building',
  camNonce: 0,
  theme: 'system',
  tab: 'office',
  tick: 0,
  setSpeed: speed => set({ speed }),
  togglePause: () => set(s => ({ paused: !s.paused })),
  select: (selected, fly = false) => set(s => ({ selected, camNonce: fly && selected !== null ? s.camNonce + 1 : s.camNonce })),
  hover: hovered => set({ hovered }),
  setFocus: focus => set({ focus }),
  setView: view => set(s => ({ view, selected: null, camNonce: s.camNonce + 1 })),
  setTheme: theme => set({ theme }),
  setTab: tab => set({ tab }),
  bump: () => set(s => ({ tick: s.tick + 1 })),
}))
