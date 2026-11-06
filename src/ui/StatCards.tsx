import { CheckCircle2, Code2, Eye, FlaskConical, OctagonAlert, Users } from 'lucide-react'
import { source } from '../data/mockSource'
import { useOffice, type FocusKey } from '../store'

interface Card { key: FocusKey | 'present'; label: string; token: string; icon: typeof Users; value: number; sub: string }

export function StatCards() {
  useOffice(s => s.tick)
  const focus = useOffice(s => s.focus)
  const setFocus = useOffice(s => s.setFocus)
  const st = source.world.stats()
  const c = st.counts
  const oldest = st.reviewQueue[0]
  const cards: Card[] = [
    { key: 'present', label: 'Có mặt', token: 'accent', icon: Users, value: st.present, sub: 'trên 10 người' },
    { key: 'doing', label: 'Đang code', token: 's-prog', icon: Code2, value: c.doing, sub: `${st.today.commits} commit hôm nay` },
    { key: 'review', label: 'Chờ review', token: 's-review', icon: Eye, value: c.review, sub: oldest ? `lâu nhất ${Math.floor(oldest.waiting / 60)}g ${String(Math.floor(oldest.waiting % 60)).padStart(2, '0')}p` : 'không có PR chờ' },
    { key: 'qa', label: 'QA test', token: 's-qa', icon: FlaskConical, value: c.qa, sub: `${st.today.deploys} lần deploy staging` },
    { key: 'blocked', label: 'Bị chặn', token: 's-blocked', icon: OctagonAlert, value: c.blocked, sub: c.blocked ? 'cần lead gỡ' : 'không có' },
    { key: 'done', label: 'Xong hôm nay', token: 's-done', icon: CheckCircle2, value: st.today.qaPass, sub: `sprint ${st.sprint.done}/${st.sprint.total}` },
  ]
  return (
    <div className="stats" role="group" aria-label="Chỉ số nhanh, bấm để lọc">
      {cards.map(card => {
        const filter = card.key !== 'present'
        const active = filter && focus === card.key
        return (
          <button
            key={card.label}
            type="button"
            className={`stat${active ? ' on' : ''}${card.key === 'blocked' && card.value ? ' alert' : ''}`}
            style={{ ['--c' as string]: `var(--${card.token})` }}
            aria-pressed={filter ? active : undefined}
            disabled={!filter}
            onClick={() => filter && setFocus(active ? null : (card.key as FocusKey))}
          >
            <span className="stat-ic"><card.icon size={18} /></span>
            <span className="stat-txt">
              <span className="stat-label">{card.label}</span>
              <span className="stat-val">{card.value}</span>
              <span className="stat-sub">{card.sub}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
