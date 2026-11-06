import { Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { source } from '../data/mockSource'
import { hhmm } from '../sim/time'
import { useOffice } from '../store'

const SEGMENTS: [number, number, string, string][] = [
  [0, 480, 'd-night', 'Ở nhà'], [480, 720, 'd-work', 'Làm việc'], [720, 810, 'd-lunch', 'Ăn trưa · ngủ trưa'],
  [810, 1050, 'd-work', 'Làm việc'], [1050, 1320, 'd-eve', 'Tan làm'], [1320, 1440, 'd-night', 'Đêm'],
]
const TICKS = [480, 720, 810, 1050, 1200]
const JUMPS = [455, 515, 735, 790, 910, 1062, 1230]
const SPEEDS = [
  { v: 1, l: '1× · 2 phút/giây' }, { v: 4, l: '4× · 8 phút/giây' }, { v: 10, l: '10× · 20 phút/giây' }, { v: 30, l: '30× · 1 giờ/giây' },
]

export function TimeBar() {
  const paused = useOffice(s => s.paused)
  const toggle = useOffice(s => s.togglePause)
  const speed = useOffice(s => s.speed)
  const setSpeed = useOffice(s => s.setSpeed)
  const bump = useOffice(s => s.bump)
  useOffice(s => s.tick)
  const [drag, setDrag] = useState<number | null>(null)
  const t = drag ?? Math.floor(source.world.t)
  const jump = (m: number) => { source.jump(m); bump() }
  return (
    <div className="timebar">
      <button type="button" className="btn primary icon-btn" onClick={toggle} aria-label={paused ? 'Chạy tiếp' : 'Tạm dừng'}>
        {paused ? <Play size={16} /> : <Pause size={16} />}<span>{paused ? 'Chạy tiếp' : 'Tạm dừng'}</span>
      </button>
      <select className="btn" value={speed} onChange={e => setSpeed(Number(e.target.value))} aria-label="Tốc độ thời gian">
        {SPEEDS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
      </select>
      <div className="track">
        <div className="sched" aria-hidden="true">
          {SEGMENTS.map(([a, b, c, l]) => <span key={a} title={l} style={{ width: `${(b - a) / 14.4}%`, background: `var(--${c})` }} />)}
        </div>
        <input
          type="range" min={0} max={1439} step={1} value={t} aria-label="Giờ trong ngày"
          onChange={e => { const v = Number(e.target.value); setDrag(v); jump(v) }}
          onPointerUp={() => setDrag(null)} onKeyUp={() => setDrag(null)} onBlur={() => setDrag(null)}
        />
        <div className="ticks" aria-hidden="true">
          {TICKS.map(m => <span key={m} style={{ left: `${m / 14.4}%` }}>{hhmm(m)}</span>)}
        </div>
      </div>
      <div className="jumps" role="group" aria-label="Nhảy tới giờ">
        {JUMPS.map(m => <button key={m} type="button" className="btn chipbtn" onClick={() => jump(m)}>{hhmm(m)}</button>)}
      </div>
    </div>
  )
}
