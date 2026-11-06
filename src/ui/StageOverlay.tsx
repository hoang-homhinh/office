import type { ReactNode } from 'react'
import { Maximize2, Minus, Plus, RotateCcw, RotateCw, X } from 'lucide-react'
import { source } from '../data/mockSource'
import { camApi, VIEWS } from '../scene/CameraRig'
import { fmtDuration, hhmm } from '../sim/time'
import { useOffice, type ViewId } from '../store'
import { STAGE_META } from './stages'
import { whereText } from './where'

const NAV: ViewId[] = ['all', 'building', 'dev', 'team', 'meeting', 'pantry', 'server', 'lounge', 'outside']

function DetailCard() {
  const selected = useOffice(s => s.selected)
  const select = useOffice(s => s.select)
  useOffice(s => s.tick)
  if (selected === null) return null
  const w = source.world
  const p = w.people[selected]
  const plan = w.plansFor(selected)
  const stage = w.wf.stageOf(selected)
  const meta = STAGE_META[stage]
  const tk = w.wf.tasks[selected]
  const isQa = selected === w.wf.qaIdx
  const rows: [string, ReactNode][] = [
    ['Đang ở', whereText(w, p)],
    ['Hôm nay', `Đến ${hhmm(plan.arrive)} · về ${hhmm(plan.leave)}${plan.overtime ? ' (làm thêm)' : ''}`],
    ['Task', <><span className="pill" style={{ ['--c' as string]: `var(--${meta.token})` }}>{meta.label}</span>{tk && <span className="age"> {fmtDuration(w.t - tk.since)}</span>}</>],
  ]
  if (isQa) rows.push(['Hàng chờ test', w.wf.qaQueue.length ? w.wf.qaQueue.map(i => w.wf.tasks[i]!.key).join(', ') : 'Trống'])
  if (tk) {
    rows.push(['Ticket', <><code>{tk.key}</code> {tk.title}</>])
    rows.push(['Branch', <code>{tk.branch}</code>])
    if (tk.pr) rows.push(['Pull request', <><code>#{tk.pr}</code>{tk.reviewer !== null ? ` · reviewer ${w.team[tk.reviewer].name}` : ''}</>])
    if (tk.blocked) rows.push(['Lý do chặn', <span className="bad">{tk.blocked}</span>])
  }
  return (
    <div className="detail">
      <div className="detail-head">
        <span className="av" style={{ background: p.cfg.shirt }}>{p.cfg.name[0]}</span>
        <span className="who"><b>{p.cfg.name}</b><span>{p.cfg.role}</span></span>
        <button type="button" className="x" aria-label="Đóng" onClick={() => select(null)}><X size={16} /></button>
      </div>
      <dl className="kv">{rows.map(([k, v]) => <div key={k} className="kv-row"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </div>
  )
}

export function StageOverlay() {
  const view = useOffice(s => s.view)
  const setView = useOffice(s => s.setView)
  const full = () => {
    const el = document.querySelector('.stage')
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }
  return (
    <>
      <div className="hint">Kéo để xoay · chuột phải để di chuyển · cuộn để phóng to · bấm vào người để xem chi tiết</div>
      <div className="camtools" role="group" aria-label="Điều khiển camera">
        <button type="button" onClick={() => camApi.zoom(4)} aria-label="Phóng to"><Plus size={16} /></button>
        <button type="button" onClick={() => camApi.zoom(-4)} aria-label="Thu nhỏ"><Minus size={16} /></button>
        <button type="button" onClick={() => camApi.rotate(0.5)} aria-label="Xoay trái"><RotateCcw size={16} /></button>
        <button type="button" onClick={() => camApi.rotate(-0.5)} aria-label="Xoay phải"><RotateCw size={16} /></button>
        <button type="button" onClick={full} aria-label="Toàn màn hình"><Maximize2 size={16} /></button>
      </div>
      <nav className="roomnav" aria-label="Chọn khu vực">
        {NAV.map(v => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{VIEWS[v].label}</button>
        ))}
      </nav>
      <DetailCard />
    </>
  )
}
