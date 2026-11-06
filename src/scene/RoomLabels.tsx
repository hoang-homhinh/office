import { Html } from '@react-three/drei'
import { Bike, Code2, Coffee, DoorOpen, Droplets, Server, Sofa, Users, type LucideIcon } from 'lucide-react'
import { ROOMS, TEAM_CLUSTER, CLUSTERS, type RoomId } from '../sim/layout'
import { useOffice, type ViewId } from '../store'
import { source } from '../data/mockSource'

const ICONS: Record<RoomId, LucideIcon> = {
  dev: Code2, meeting: Users, pantry: Coffee, lounge: Sofa, lobby: DoorOpen, server: Server, wc: Droplets, parking: Bike,
}
const VIEW_OF: Partial<Record<RoomId, ViewId>> = {
  dev: 'dev', meeting: 'meeting', pantry: 'pantry', lounge: 'lounge', server: 'server', parking: 'outside',
}

/** Label x overrides so tags don't collide with the team-cluster tag or the entrance path. */
const LABEL_X: Partial<Record<RoomId, number>> = { dev: 4.8, lobby: 17, parking: 5.2 }

export function RoomLabels() {
  const setView = useOffice(s => s.setView)
  useOffice(s => s.tick)
  const st = source.world.stats()
  const [cx, cz] = CLUSTERS[TEAM_CLUSTER]
  return (
    <group>
      {ROOMS.map(r => {
        const Icon = ICONS[r.id]
        const [x0, , x1, z1] = r.rect
        const v = VIEW_OF[r.id]
        const x = LABEL_X[r.id] ?? (x0 + x1) / 2
        return (
          <Html key={r.id} position={[x, 0.12, z1 - 0.45]} center zIndexRange={[9, 0]}>
            <button type="button" className="roomtag" style={{ ['--rc' as string]: r.color }} onClick={() => v && setView(v)} disabled={!v}>
              <Icon size={14} strokeWidth={2.2} />
              {r.name}
              {r.id === 'server' && <span className={`rt-dot${st.ciFailRecent ? ' bad' : st.pipelineBusy ? ' busy' : ''}`} />}
            </button>
          </Html>
        )
      })}
      <Html position={[cx + 3.2, 0.05, cz + 2.9]} center zIndexRange={[9, 0]}>
        <button type="button" className="roomtag team" onClick={() => setView('team')}>
          Team Dev · {st.present}/10 có mặt
        </button>
      </Html>
    </group>
  )
}
