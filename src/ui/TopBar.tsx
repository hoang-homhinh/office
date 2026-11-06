import { Building2, CalendarRange, Monitor, Moon, Sun } from 'lucide-react'
import { source } from '../data/mockSource'
import { phaseOf } from '../scene/sky'
import { hhmm } from '../sim/time'
import { useOffice, type ThemePref } from '../store'

const THEMES: { id: ThemePref; icon: typeof Sun; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Giao diện sáng' },
  { id: 'system', icon: Monitor, label: 'Theo hệ thống' },
  { id: 'dark', icon: Moon, label: 'Giao diện tối' },
]

export function TopBar() {
  const tab = useOffice(s => s.tab)
  const setTab = useOffice(s => s.setTab)
  const theme = useOffice(s => s.theme)
  const setTheme = useOffice(s => s.setTheme)
  useOffice(s => s.tick)
  const w = source.world
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark"><Building2 size={20} /></span>
        <div>
          <h1>Văn phòng Team Dev</h1>
          <p>Mỗi người đứng đúng chỗ theo giờ, nhãn màu là trạng thái task trên Git</p>
        </div>
      </div>
      <nav className="tabs" aria-label="Chế độ xem">
        <button type="button" aria-pressed={tab === 'office'} onClick={() => setTab('office')}><Building2 size={15} />Văn phòng 3D</button>
        <button type="button" aria-pressed={tab === 'timeline'} onClick={() => setTab('timeline')}><CalendarRange size={15} />Dòng thời gian</button>
      </nav>
      <div className="clock">
        <span className="sample">Dữ liệu mẫu</span>
        <span className="time">{hhmm(w.t)}</span>
        <span className="phase"><b>{phaseOf(w.t)}</b><small>Ngày {w.day}</small></span>
      </div>
      <div className="theme" role="group" aria-label="Giao diện">
        {THEMES.map(t => (
          <button key={t.id} type="button" aria-pressed={theme === t.id} title={t.label} aria-label={t.label} onClick={() => setTheme(t.id)}>
            <t.icon size={15} />
          </button>
        ))}
      </div>
    </header>
  )
}
