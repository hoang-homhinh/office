import { useEffect } from 'react'
import { source } from './data/mockSource'
import { Office, perf } from './scene/Office'
import { useOffice, type ViewId } from './store'
import { Feed, Members, ReviewQueue, Sprint } from './ui/panels/Panels'
import { StageOverlay } from './ui/StageOverlay'
import { StatCards } from './ui/StatCards'
import { TimeBar } from './ui/TimeBar'
import { Timeline } from './ui/Timeline'
import { TopBar } from './ui/TopBar'

declare global {
  interface Window {
    __office?: {
      jump: (t: number) => void
      speed: (s: number) => void
      pause: (p: boolean) => void
      select: (i: number | null) => void
      view: (v: ViewId) => void
      tab: (t: 'office' | 'timeline') => void
      readonly fps: number
      readonly perf: { fps: number; calls: number; programs: number }
      readonly t: number
    }
  }
}

function useUiTicker() {
  const bump = useOffice(s => s.bump)
  useEffect(() => {
    const id = window.setInterval(bump, 250)
    return () => window.clearInterval(id)
  }, [bump])
}

/** When the 3D view is hidden the canvas stops, so drive the simulation here instead. */
function useBackgroundSim(active: boolean) {
  useEffect(() => {
    if (!active) return
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const s = useOffice.getState()
      if (!s.paused) source.tick(Math.min((now - last) / 1000, 0.1), s.speed)
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])
}

function useTheme() {
  const theme = useOffice(s => s.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])
}

export default function App() {
  const tab = useOffice(s => s.tab)
  useUiTicker()
  useTheme()
  useBackgroundSim(tab !== 'office')

  useEffect(() => {
    const st = useOffice.getState
    window.__office = {
      jump: t => { source.jump(t); st().bump() },
      speed: s => st().setSpeed(s),
      pause: p => { if (st().paused !== p) st().togglePause() },
      select: i => st().select(i, true),
      view: v => st().setView(v),
      tab: t => st().setTab(t),
      get fps() { return perf.fps },
      get perf() { return { ...perf } },
      get t() { return source.world.t },
    }
  }, [])

  return (
    <div className="app">
      <TopBar />
      <StatCards />
      <section className="stage" hidden={tab !== 'office'}>
        <Office active={tab === 'office'} />
        <StageOverlay />
      </section>
      {tab === 'timeline' && <Timeline />}
      <TimeBar />
      <div className="panels">
        <Members />
        <ReviewQueue />
        <Sprint />
        <Feed />
      </div>
    </div>
  )
}
