import type { DisplayStage } from '../sim/types'

/** Single source of truth for stage labels and colours (CSS tokens `--s-*`). */
export const STAGE_META: Record<DisplayStage, { label: string; short: string; token: string }> = {
  doing: { label: 'Đang code', short: 'Code', token: 's-prog' },
  review: { label: 'Chờ review', short: 'Review', token: 's-review' },
  qa: { label: 'Chờ QA test', short: 'QA', token: 's-qa' },
  done: { label: 'Xong', short: 'Xong', token: 's-done' },
  blocked: { label: 'Bị chặn', short: 'Chặn', token: 's-blocked' },
  test: { label: 'Đang test', short: 'Test', token: 's-qa' },
  testidle: { label: 'Viết test case', short: 'Test case', token: 's-idle' },
}

/** Hex fallbacks for canvas/3D use where CSS variables are unavailable. */
export const STAGE_HEX: Record<string, string> = {
  's-prog': '#4C8DFF', 's-review': '#A274FF', 's-qa': '#F2A93B', 's-done': '#35C486', 's-blocked': '#F0605A', 's-idle': '#8D9CA8',
}
