export type TaskStage = 'doing' | 'review' | 'qa' | 'done'
export type DisplayStage = TaskStage | 'blocked' | 'test' | 'testidle'
export type Activity = 'home' | 'work' | 'standup' | 'sprint' | 'eat' | 'nap' | 'wc'
export type PlaceKey = 'home' | 'seat' | 'meet' | 'pantry' | 'sofa' | 'wc' | 'parking'
export type Role = 'Backend' | 'Frontend' | 'QA' | 'DevOps' | 'Mobile' | 'Fullstack'

export interface Vec2 { x: number; z: number }
/** face: +1 faces +z (toward camera), -1 faces -z */
export interface Spot extends Vec2 { face: number }

export interface PersonConfig {
  id: string
  name: string
  role: Role
  shirt: string
  pants: string
  skin: string
  hair: string
  longHair: boolean
}
