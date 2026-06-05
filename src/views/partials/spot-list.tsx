import type { FC } from 'hono/jsx'

export type SpotCardData = {
  id: number
  name: string
  type: 'ground' | 'planter'
  plantingCount: number
}

const typeLabel = { ground: '地植え', planter: 'プランター' }

export const SpotCard: FC<SpotCardData> = ({ id, name, type, plantingCount }) => (
  <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
    <div class="card-body p-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-bold">{name}</h3>
        <span class="badge badge-outline badge-sm">{typeLabel[type]}</span>
      </div>
      <p class="text-sm text-base-content/60">{plantingCount}種栽培中</p>
      <div class="card-actions justify-end">
        <a href={`/spots/${id}`} class="btn btn-ghost btn-xs">詳細 →</a>
      </div>
    </div>
  </div>
)

type SpotListProps = {
  spots?: SpotCardData[]
}

const MOCK_SPOTS: SpotCardData[] = [
  { id: 1, name: 'ベランダプランター左', type: 'planter', plantingCount: 2 },
  { id: 2, name: '庭の南区画', type: 'ground', plantingCount: 1 },
]

export const SpotList: FC<SpotListProps> = ({ spots = MOCK_SPOTS }) => (
  <div id="spot-list" class="space-y-3">
    {spots.length === 0 ? (
      <div class="text-center py-8 text-base-content/50">
        スポットがありません。最初のスポットを追加してください。
      </div>
    ) : (
      spots.map((s) => <SpotCard {...s} />)
    )}
  </div>
)
