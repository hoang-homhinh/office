import { beforeEach, describe, expect, it } from 'vitest'
import { Rng } from './rng'
import { Workflow } from './workflow'
import { TEAM } from '../config/team'

const QA = TEAM.findIndex(p => p.role === 'QA')
let wf: Workflow

beforeEach(() => {
  wf = new Workflow(TEAM, new Rng(9), 480)
  // put everyone into a known state: fresh ticket in 'doing'
  wf.tasks.forEach((tk, i) => { if (tk) { tk.stage = 'doing'; tk.blocked = null; tk.pr = null; tk.reviewer = null } else expect(i).toBe(QA) })
  wf.qaQueue.length = 0
})

describe('Workflow', () => {
  it('QA has no own ticket and shows as testidle with an empty queue', () => {
    expect(wf.tasks[QA]).toBeNull()
    expect(wf.stageOf(QA)).toBe('testidle')
    expect(wf.canAct(QA)).toBe(false)
  })

  it('doing → pr_opened moves to review with a PR and a reviewer that is not QA or self', () => {
    const ev = wf.step(0, 500, 0.9)
    expect(ev.map(e => e.kind)).toEqual(['pr_opened'])
    const tk = wf.tasks[0]!
    expect(tk.stage).toBe('review')
    expect(tk.pr).toBeGreaterThan(0)
    expect(tk.reviewer).not.toBe(0)
    expect(tk.reviewer).not.toBe(QA)
  })

  it('a commit keeps the task in doing', () => {
    expect(wf.step(0, 500, 0.3).map(e => e.kind)).toEqual(['commit'])
    expect(wf.tasks[0]!.stage).toBe('doing')
  })

  it('review_changes sends the task back to doing', () => {
    wf.step(0, 500, 0.9)
    expect(wf.step(0, 520, 0.1).map(e => e.kind)).toEqual(['review_changes'])
    expect(wf.tasks[0]!.stage).toBe('doing')
  })

  it('ci_failed on a PR sends the task back to doing', () => {
    wf.step(0, 500, 0.9)
    expect(wf.step(0, 520, 0.28).map(e => e.kind)).toEqual(['ci_failed'])
    expect(wf.tasks[0]!.stage).toBe('doing')
  })

  it('approval merges, deploys to staging and queues for QA', () => {
    wf.step(0, 500, 0.9)
    expect(wf.step(0, 520, 0.9).map(e => e.kind)).toEqual(['review_approved', 'merged', 'deployed_staging'])
    expect(wf.tasks[0]!.stage).toBe('qa')
    expect(wf.qaQueue).toEqual([0])
    expect(wf.canAct(0)).toBe(false)
    expect(wf.stageOf(QA)).toBe('test')
  })

  it('QA processes the queue first-in first-out', () => {
    for (const i of [1, 2]) { wf.step(i, 500, 0.9); wf.step(i, 510, 0.9) }
    expect(wf.qaQueue).toEqual([1, 2])
    expect(wf.step(QA, 530, 0.9).map(e => e.kind)).toEqual(['qa_pass'])
    expect(wf.tasks[1]!.stage).toBe('done')
    expect(wf.qaQueue).toEqual([2])
  })

  it('qa_fail reopens the ticket', () => {
    wf.step(1, 500, 0.9); wf.step(1, 510, 0.9)
    expect(wf.step(QA, 530, 0.1).map(e => e.kind)).toEqual(['qa_fail'])
    expect(wf.tasks[1]!.stage).toBe('doing')
  })

  it('blocked keeps the stage and unblock returns to it', () => {
    wf.step(0, 500, 0.9) // review
    wf.tasks[0]!.blocked = null
    wf.block(0, 505, 'Chờ API từ team đối tác')
    expect(wf.stageOf(0)).toBe('blocked')
    expect(wf.step(0, 510, 0.9)).toEqual([])
    expect(wf.step(0, 515, 0.1).map(e => e.kind)).toEqual(['unblocked'])
    expect(wf.stageOf(0)).toBe('review')
  })

  it('doing can become blocked with a reason', () => {
    const ev = wf.step(0, 500, 0.05)
    expect(ev[0].kind).toBe('blocked')
    expect(ev[0].reason).toBeTruthy()
    expect(wf.stageOf(0)).toBe('blocked')
  })

  it('done → ticket_assigned gives a new ticket in doing', () => {
    wf.tasks[0]!.stage = 'done'
    const old = wf.tasks[0]!.key
    expect(wf.step(0, 600, 0.5).map(e => e.kind)).toEqual(['ticket_assigned'])
    expect(wf.tasks[0]!.key).not.toBe(old)
    expect(wf.tasks[0]!.stage).toBe('doing')
  })

  it('counts sprint done tickets on qa_pass', () => {
    const before = wf.sprint.done
    wf.step(1, 500, 0.9); wf.step(1, 510, 0.9); wf.step(QA, 520, 0.9)
    expect(wf.sprint.done).toBe(before + 1)
  })
})
