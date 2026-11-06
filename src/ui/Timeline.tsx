import { source } from '../data/mockSource'
import { want } from '../sim/schedule'
import { hhmm } from '../sim/time'
import type { Activity } from '../sim/types'
import { useOffice } from '../store'
import { describe, eventToken } from './describe'

const FROM = 7 * 60, TO = 21 * 60, STEP = 5
const ACT: Record<Activity, { label: string; token: string }> = {
  home: { label: 'Không ở văn phòng', token: 'transparent' },
  work: { label: 'Làm việc', token: 'a-work' },
  standup: { label: 'Standup', token: 'a-meet' },
  sprint: { label: 'Họp sprint', token: 'a-meet' },
  eat: { label: 'Ăn trưa', token: 'a-eat' },
  nap: { label: 'Ngủ trưa', token: 'a-nap' },
  wc: { label: 'WC', token: 'a-wc' },
}
const pct = (m: number) => `${((m - FROM) / (TO - FROM)) * 100}%`

export function Timeline() {
  useOffice(s => s.tick)
  const select = useOffice(s => s.select)
  const w = source.world
  const hours = Array.from({ length: (TO - FROM) / 60 + 1 }, (_, i) => FROM + i * 60)
  return (
    <section className="timeline" aria-label="Dòng thời gian trong ngày">
      <div className="tl-legend">
        {(['work', 'standup', 'eat', 'nap', 'wc'] as Activity[]).map(a => (
          <span key={a}><i style={{ background: `var(--${ACT[a].token})` }} />{a === 'standup' ? 'Họp' : ACT[a].label}</span>
        ))}
        <span><i className="ev" />Sự kiện Git</span>
      </div>
      <div className="tl-grid">
        <div className="tl-hours">
          {hours.map(h => <span key={h} style={{ left: pct(h) }}>{hhmm(h)}</span>)}
        </div>
        {w.people.map(p => {
          const plan = w.plansFor(p.idx)
          const segs: { a: number; b: number; act: Activity }[] = []
          for (let m = FROM; m < TO; m += STEP) {
            const act = want(plan, m + STEP / 2).act
            const last = segs[segs.length - 1]
            if (last && last.act === act) last.b = m + STEP
            else segs.push({ a: m, b: m + STEP, act })
          }
          const evs = w.events.filter(e => e.day === w.day && e.actor === p.idx && e.at >= FROM && e.at <= TO)
          return (
            <div key={p.idx} className="tl-row">
              <button type="button" className="tl-name" onClick={() => select(p.idx)}>
                <span className="av sm" style={{ background: p.cfg.shirt }}>{p.cfg.name[0]}</span>{p.cfg.name}<small>{p.cfg.role}</small>
              </button>
              <div className="tl-bar">
                {hours.map(h => <i key={h} className="tl-tick" style={{ left: pct(h) }} />)}
                {segs.filter(s => s.act !== 'home').map(s => (
                  <span key={s.a} className="tl-seg" title={`${ACT[s.act].label} ${hhmm(s.a)}–${hhmm(s.b)}`}
                    style={{ left: pct(s.a), width: `${((s.b - s.a) / (TO - FROM)) * 100}%`, background: `var(--${ACT[s.act].token})` }} />
                ))}
                {evs.map((e, i) => (
                  <span key={i} className="tl-ev" style={{ left: pct(e.at), ['--c' as string]: `var(--${eventToken(e)})` }}>
                    <span className="tl-tip">{hhmm(e.at)} · {describe(e, w.team)}</span>
                  </span>
                ))}
                {w.t >= FROM && w.t <= TO && <span className="tl-now" style={{ left: pct(w.t) }} />}
              </div>
            </div>
          )
        })}
      </div>
      <p className="note">Lịch sinh hoạt (đến, ăn trưa, ngủ trưa, WC, về) là mô phỏng theo giờ hành chính, không theo dõi thật. Chấm màu là sự kiện Git trong ngày.</p>
    </section>
  )
}
