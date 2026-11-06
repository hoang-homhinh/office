import type { Rng } from './rng'
import type { DisplayStage, PersonConfig, TaskStage } from './types'

export type GitEventKind =
  | 'ticket_assigned' | 'commit' | 'pr_opened' | 'review_changes' | 'ci_failed' | 'review_approved'
  | 'merged' | 'deployed_staging' | 'qa_pass' | 'qa_fail' | 'blocked' | 'unblocked'

export interface GitEvent {
  at: number
  day: number
  actor: number
  kind: GitEventKind
  ticket: string
  title: string
  branch: string
  pr?: number
  reviewer?: number
  reason?: string
  commits?: number
  /** for QA events: owner of the ticket */
  owner?: number
}

export interface Task {
  key: string
  title: string
  branch: string
  stage: TaskStage
  pr: number | null
  reviewer: number | null
  blocked: string | null
  /** minute the current stage (or block) started — used for "waiting for" ages */
  since: number
  prOpenedAt: number | null
}

const TITLES: [string, string][] = [
  ['Đăng nhập bằng OTP', 'login-otp'], ['Xuất báo cáo Excel', 'export-excel'], ['Sửa lỗi phân trang', 'fix-pagination'],
  ['API đối soát ngân hàng', 'bank-reconcile'], ['Cache kết quả tìm kiếm', 'search-cache'], ['Cài đặt thông báo', 'notify-settings'],
  ['Migrate bảng invoices', 'migrate-invoices'], ['Retry khi OCR timeout', 'ocr-retry'], ['Refactor module thanh toán', 'payment-refactor'],
  ['Thêm log audit', 'audit-log'], ['Tối ưu query dashboard', 'dashboard-query'], ['Upload file nhiều phần', 'multipart-upload'],
  ['Chuẩn hoá định dạng ngày', 'date-normalize'], ['Phân quyền theo phòng ban', 'dept-rbac'], ['Webhook GitHub vào DB', 'gh-webhook'],
  ['Sửa lỗi timezone báo cáo', 'fix-report-tz'], ['Màn hình lịch sử giao dịch', 'tx-history'], ['Gửi email nhắc hạn', 'due-reminder'],
  ['Sửa lỗi upload ảnh iOS', 'fix-ios-upload'], ['Rate limit cho API công khai', 'api-rate-limit'], ['Dark mode trang quản trị', 'admin-dark-mode'],
]
export const BLOCKERS = [
  'Chờ API từ team đối tác', 'Thiếu spec màn hình', 'Chờ quyền vào DB staging',
  'Chờ khách hàng xác nhận', 'Phụ thuộc PR chưa merge', 'Môi trường staging lỗi',
]

/** Outcome thresholds for a uniform roll r ∈ [0,1). */
const P = { doingBlock: 0.1, doingCommit: 0.55, reviewChanges: 0.22, reviewCiFail: 0.32, qaFail: 0.25, unblock: 0.5 }

export class Workflow {
  readonly team: readonly PersonConfig[]
  readonly qaIdx: number
  tasks: (Task | null)[]
  qaQueue: number[] = []
  sprint = { name: 'Sprint 24', total: 26, done: 9 }
  day = 1
  private rng: Rng
  private ticketNo = 231
  private prNo = 412
  private titleIdx = 0

  constructor(team: readonly PersonConfig[], rng: Rng, t0: number) {
    this.team = team
    this.rng = rng
    this.qaIdx = team.findIndex(p => p.role === 'QA')
    const start: TaskStage[] = ['doing', 'review', 'doing', 'doing', 'doing', 'review', 'qa', 'doing', 'done', 'doing']
    this.tasks = team.map((_, i) => {
      if (i === this.qaIdx) return null
      const tk = this.newTask(t0 - rng.range(10, 200))
      tk.stage = start[i % start.length]
      if (tk.stage !== 'doing') { tk.pr = this.prNo++; tk.reviewer = this.pickReviewer(i); tk.prOpenedAt = tk.since }
      if (tk.stage === 'qa') this.qaQueue.push(i)
      return tk
    })
    const firstDev = this.tasks.findIndex((t, i) => t && i !== this.qaIdx && t.stage === 'doing')
    if (firstDev >= 0) this.tasks[firstDev]!.blocked = BLOCKERS[0]
  }

  private newTask(t: number): Task {
    const [title, slug] = TITLES[this.titleIdx++ % TITLES.length]
    const n = this.ticketNo++
    return {
      key: `APP-${n}`, title, branch: `${/^Sửa/.test(title) ? 'fix' : 'feat'}/app-${n}-${slug}`,
      stage: 'doing', pr: null, reviewer: null, blocked: null, since: t, prOpenedAt: null,
    }
  }

  private pickReviewer(i: number): number {
    const pool = this.team.map((_, k) => k).filter(k => k !== i && k !== this.qaIdx)
    return this.rng.pick(pool)
  }

  stageOf(i: number): DisplayStage {
    if (i === this.qaIdx) return this.qaQueue.length ? 'test' : 'testidle'
    const tk = this.tasks[i]!
    return tk.blocked ? 'blocked' : tk.stage
  }

  /** Whether this person has an action available (used to pick who generates the next event). */
  canAct(i: number): boolean {
    if (i === this.qaIdx) return this.qaQueue.length > 0
    return this.tasks[i]!.stage !== 'qa' || !!this.tasks[i]!.blocked
  }

  block(i: number, t: number, reason: string): GitEvent {
    const tk = this.tasks[i]!
    tk.blocked = reason
    tk.since = t
    return this.ev(i, t, 'blocked', tk, { reason })
  }

  private ev(actor: number, at: number, kind: GitEventKind, tk: Task, extra: Partial<GitEvent> = {}): GitEvent {
    return {
      at, day: this.day, actor, kind, ticket: tk.key, title: tk.title, branch: tk.branch,
      pr: tk.pr ?? undefined, reviewer: tk.reviewer ?? undefined, ...extra,
    }
  }

  /** Advance person i's work by one event using roll r ∈ [0,1). Returns emitted events (possibly none). */
  step(i: number, t: number, r: number): GitEvent[] {
    if (i === this.qaIdx) {
      const owner = this.qaQueue.shift()
      if (owner === undefined) return []
      const tk = this.tasks[owner]!
      tk.since = t
      if (r < P.qaFail) { tk.stage = 'doing'; return [this.ev(i, t, 'qa_fail', tk, { owner })] }
      tk.stage = 'done'
      this.sprint.done++
      return [this.ev(i, t, 'qa_pass', tk, { owner })]
    }
    const tk = this.tasks[i]!
    if (tk.blocked) {
      if (r >= P.unblock) return []
      tk.blocked = null
      tk.since = t
      return [this.ev(i, t, 'unblocked', tk)]
    }
    switch (tk.stage) {
      case 'doing':
        if (r < P.doingBlock) return [this.block(i, t, this.rng.pick(BLOCKERS))]
        if (r < P.doingCommit) return [this.ev(i, t, 'commit', tk, { commits: 1 + Math.floor(this.rng.next() * 4) })]
        if (!tk.pr) tk.pr = this.prNo++
        tk.reviewer = this.pickReviewer(i)
        tk.stage = 'review'
        tk.since = t
        tk.prOpenedAt = t
        return [this.ev(i, t, 'pr_opened', tk)]
      case 'review':
        tk.since = t
        if (r < P.reviewChanges) { tk.stage = 'doing'; return [this.ev(i, t, 'review_changes', tk)] }
        if (r < P.reviewCiFail) { tk.stage = 'doing'; return [this.ev(i, t, 'ci_failed', tk)] }
        tk.stage = 'qa'
        this.qaQueue.push(i)
        return [this.ev(i, t, 'review_approved', tk), this.ev(i, t, 'merged', tk), this.ev(i, t, 'deployed_staging', tk)]
      case 'qa':
        return []
      case 'done': {
        const next = this.newTask(t)
        this.tasks[i] = next
        return [this.ev(i, t, 'ticket_assigned', next)]
      }
    }
  }
}
