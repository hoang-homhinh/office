import type { World, PersonState } from '../sim/world'
import { hhmm } from '../sim/time'

const DEST: Record<string, string> = { seat: 'chỗ ngồi', meet: 'phòng họp', pantry: 'pantry', wc: 'WC', sofa: 'khu thư giãn', parking: 'bãi xe' }

/** Short Vietnamese description of where a person is and what they are doing. */
export function whereText(w: World, p: PersonState): string {
  const plan = w.plansFor(p.idx)
  if (p.place === 'home' && !p.path.length) return w.t < plan.arrive ? `Chưa đến · dự kiến ${hhmm(plan.arrive)}` : `Đã về lúc ${hhmm(plan.leave)}`
  if (p.path.length) {
    if (p.leaving) return 'Đang ra về'
    if (p.place === 'parking') return 'Vừa tới, đang vào chỗ'
    return `Đang đi tới ${DEST[p.dest] ?? ''}`
  }
  switch (p.act) {
    case 'work': return w.t >= 1050 ? 'Làm thêm giờ' : 'Đang làm ở bàn'
    case 'nap': return p.place === 'sofa' ? 'Ngủ trưa ở sofa' : 'Ngủ trưa tại bàn'
    case 'eat': return 'Ăn trưa ở pantry'
    case 'standup': return 'Họp standup'
    case 'sprint': return 'Họp sprint'
    case 'wc': return 'Đi WC'
    default: return 'Ở văn phòng'
  }
}

export function isAway(p: PersonState) {
  return p.place === 'home' && !p.path.length
}
