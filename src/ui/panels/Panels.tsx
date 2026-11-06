import { Activity, GitPullRequest, Rocket, Users } from 'lucide-react'
import { source } from '../../data/mockSource'
import { fmtDuration, hhmm } from '../../sim/time'
import { useOffice } from '../../store'
import { describe, eventToken } from '../describe'
import { STAGE_META } from '../stages'
import { isAway, whereText } from '../where'

export function Members() {
  useOffice(s => s.tick)
  const selected = useOffice(s => s.selected)
  const select = useOffice(s => s.select)
  const w = source.world
  const st = w.stats()
  return (
    <section className="panel">
      <h2><Users size={14} />Thành viên<span className="h2-meta">{st.present}/10 có mặt</span></h2>
      <ul className="roster">
        {w.people.map(p => {
          const stage = w.wf.stageOf(p.idx)
          const meta = STAGE_META[stage]
          const tk = w.wf.tasks[p.idx]
          const isQa = p.idx === w.wf.qaIdx
          const sub = isQa
            ? (w.wf.qaQueue.length ? `Đang test ${w.wf.tasks[w.wf.qaQueue[0]]!.key} · còn ${w.wf.qaQueue.length} chờ` : 'Không có ticket chờ test')
            : `${tk!.key} · ${tk!.title}`
          const age = tk ? w.t - tk.since : 0
          const warn = !!tk && (!!tk.blocked || (tk.stage === 'review' && age >= 120))
          return (
            <li key={p.idx} className={`${selected === p.idx ? 'sel' : ''}${isAway(p) ? ' away' : ''}`}>
              <button type="button" onClick={() => select(selected === p.idx ? null : p.idx, true)}>
                <span className="av" style={{ background: p.cfg.shirt }}>{p.cfg.name[0]}</span>
                <span className="r-main">
                  <span className="r-name">{p.cfg.name} <span className="r-role">· {p.cfg.role}</span></span>
                  <span className="r-sub">{whereText(w, p)}</span>
                  <span className="r-sub">{sub}</span>
                </span>
                <span className="r-right">
                  <span className="pill" style={{ ['--c' as string]: `var(--${meta.token})` }}>{meta.label}</span>
                  {!isQa && <span className={`age${warn ? ' warn' : ''}`}>{fmtDuration(age)}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function ReviewQueue() {
  useOffice(s => s.tick)
  const select = useOffice(s => s.select)
  const w = source.world
  const q = w.stats().reviewQueue
  return (
    <section className="panel">
      <h2><GitPullRequest size={14} />PR chờ review<span className="h2-meta">{q.length} PR</span></h2>
      {q.length === 0 ? <p className="empty">Không có PR nào đang chờ review.</p> : (
        <ul className="prs">
          {q.map(r => {
            const pct = Math.min(100, (r.waiting / 240) * 100)
            const level = r.waiting >= 120 ? 'bad' : r.waiting >= 60 ? 'mid' : 'ok'
            return (
              <li key={r.pr}>
                <button type="button" onClick={() => select(r.idx, true)}>
                  <span className="pr-top"><code>#{r.pr}</code><span className="pr-title">{r.title}</span></span>
                  <span className="pr-meta">{w.team[r.idx].name} → {w.team[r.reviewer].name} · <code>{r.ticket}</code></span>
                  <span className={`bar ${level}`}><span style={{ width: `${pct}%` }} /></span>
                  <span className={`pr-wait ${level}`}>chờ {fmtDuration(r.waiting)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="note">Thanh đỏ khi PR chờ quá 2 giờ.</p>
    </section>
  )
}

function Donut({ done, total }: { done: number; total: number }) {
  const r = 34, c = 2 * Math.PI * r, pct = total ? done / total : 0
  return (
    <svg viewBox="0 0 88 88" className="donut" role="img" aria-label={`Hoàn thành ${done} trên ${total} ticket`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--s-done)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 44 44)" />
      <text x="44" y="42" textAnchor="middle" className="donut-big">{Math.round(pct * 100)}%</text>
      <text x="44" y="57" textAnchor="middle" className="donut-small">{done}/{total}</text>
    </svg>
  )
}

function Burndown({ points, total, days }: { points: number[]; total: number; days: number }) {
  const W = 220, H = 92, L = 24, B = 18, T = 8, R = 8
  const x = (i: number) => L + (i / (days - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / total) * (H - T - B)
  const actual = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = points.length - 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="burn" role="img" aria-label="Biểu đồ burndown sprint">
      {[0, 0.5, 1].map(f => <line key={f} x1={L} x2={W - R} y1={y(total * f)} y2={y(total * f)} className="grid" />)}
      {[0, total / 2, total].map(v => <text key={v} x={L - 4} y={y(v) + 3} textAnchor="end" className="axis">{Math.round(v)}</text>)}
      <line x1={x(0)} y1={y(total)} x2={x(days - 1)} y2={y(0)} className="ideal" />
      <path d={`${actual} L${x(last)},${y(0)} L${x(0)},${y(0)} Z`} className="area" />
      <path d={actual} className="actual" />
      <circle cx={x(last)} cy={y(points[last])} r="3.5" className="dot" />
      <text x={x(0)} y={H - 4} className="axis">Ngày 1</text>
      <text x={x(days - 1)} y={H - 4} textAnchor="end" className="axis">Ngày {days}</text>
    </svg>
  )
}

export function Sprint() {
  useOffice(s => s.tick)
  const st = source.world.stats()
  const sp = st.sprint
  return (
    <section className="panel">
      <h2><Rocket size={14} />Tiến độ {sp.name}<span className="h2-meta">ngày {Math.min(sp.dayOfSprint, sp.sprintDays)}/{sp.sprintDays}</span></h2>
      <div className="sprint">
        <Donut done={sp.done} total={sp.total} />
        <dl className="mini">
          <div><dt>Còn lại</dt><dd>{sp.remaining} ticket</dd></div>
          <div><dt>Merge hôm nay</dt><dd>{st.today.merged}</dd></div>
          <div><dt>Deploy staging</dt><dd>{st.today.deploys}{st.lastDeployAt !== null && <small> · lần cuối {hhmm(st.lastDeployAt)}</small>}</dd></div>
          <div><dt>CI fail hôm nay</dt><dd className={st.today.ciFails ? 'bad' : ''}>{st.today.ciFails}</dd></div>
        </dl>
      </div>
      <Burndown points={st.burndown} total={sp.total} days={sp.sprintDays} />
      <p className={`pipe ${st.ciFailRecent ? 'bad' : st.pipelineBusy ? 'busy' : 'ok'}`}>
        <span className="pipe-dot" />
        {st.ciFailRecent ? 'Pipeline vừa có CI fail' : st.pipelineBusy ? 'Pipeline đang chạy' : 'Pipeline rảnh'}
      </p>
    </section>
  )
}

export function Feed() {
  useOffice(s => s.tick)
  const w = source.world
  const evs = w.events.slice(-40).reverse()
  return (
    <section className="panel">
      <h2><Activity size={14} />Hoạt động Git<span className="h2-meta">{w.events.filter(e => e.day === w.day).length} sự kiện hôm nay</span></h2>
      {evs.length === 0 ? <p className="empty">Chưa có hoạt động. Sự kiện Git bắt đầu khi mọi người vào làm lúc 8:00.</p> : (
        <ul className="feed">
          {evs.map((e, i) => (
            <li key={`${e.day}-${e.at}-${i}`} style={{ ['--c' as string]: `var(--${eventToken(e)})` }}>
              <span className="t">{hhmm(e.at)}</span><span className="d" /><span className="txt">{describe(e, w.team)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
