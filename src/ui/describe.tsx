import type { ReactNode } from 'react'
import type { GitEvent } from '../sim/workflow'
import type { PersonConfig } from '../sim/types'

const KIND_TOKEN: Record<GitEvent['kind'], string> = {
  ticket_assigned: 's-prog', commit: 's-prog', pr_opened: 's-review', review_changes: 's-review', ci_failed: 's-blocked',
  review_approved: 's-review', merged: 's-done', deployed_staging: 's-qa', qa_pass: 's-done', qa_fail: 's-blocked',
  blocked: 's-blocked', unblocked: 's-prog',
}

export function eventToken(e: GitEvent) {
  return KIND_TOKEN[e.kind]
}

/** Human sentence for a git/tracker event (Vietnamese). */
export function describe(e: GitEvent, team: readonly PersonConfig[]): ReactNode {
  const who = <b>{team[e.actor].name}</b>
  const T = <code>{e.ticket}</code>
  const PR = e.pr ? <code>#{e.pr}</code> : null
  const rv = e.reviewer !== undefined ? team[e.reviewer].name : ''
  const owner = e.owner !== undefined ? team[e.owner].name : ''
  switch (e.kind) {
    case 'ticket_assigned': return <>{who} nhận {T} {e.title}, tạo branch <code>{e.branch}</code></>
    case 'commit': return <>{who} đẩy {e.commits} commit lên <code>{e.branch}</code></>
    case 'pr_opened': return <>{who} mở PR {PR} cho {T}, nhờ {rv} review</>
    case 'review_changes': return <>{rv} yêu cầu sửa PR {PR} của {who}</>
    case 'ci_failed': return <>CI fail trên PR {PR} của {who}</>
    case 'review_approved': return <>{rv} approve PR {PR} của {who}</>
    case 'merged': return <>PR {PR} merge vào <code>develop</code></>
    case 'deployed_staging': return <>Deploy {T} lên staging, chờ QA</>
    case 'qa_pass': return <>{who} test pass {T} của {owner}, đóng ticket</>
    case 'qa_fail': return <>{who} test {T} thấy bug, mở lại cho {owner}</>
    case 'blocked': return <>{T} của {who} bị chặn: {e.reason}</>
    case 'unblocked': return <>{T} của {who} đã gỡ chặn</>
  }
}
