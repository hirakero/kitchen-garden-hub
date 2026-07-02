import type { FC } from 'hono/jsx'
import { PlantingCard, type PlantingCardData } from '../partials/planting-card'
import { spotTypeLabel } from '../partials/spot-list'

type SpotDetailProps = {
  id: number
  name: string
  type: 'ground' | 'planter'
  plantings: PlantingCardData[]
}

export const SpotDetailPage: FC<SpotDetailProps> = ({ id, name, type, plantings }) => (
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <a href="/spots" class="btn btn-ghost btn-sm">← 戻る</a>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">{name}</h1>
          <span class="text-sm text-base-content/50 bg-base-200 rounded px-2 py-0.5">{spotTypeLabel[type]}</span>
        </div>
      </div>
    </div>

    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">栽培中の野菜</h2>
        <a href={`/spots/${id}/plantings/new`} class="btn btn-primary btn-sm">+ 野菜を植える</a>
      </div>
      {plantings.length === 0 ? (
        <div class="text-center py-8 text-base-content/50 text-sm">
          まだ野菜がありません。「野菜を植える」から追加してください。
        </div>
      ) : (
        <div class="space-y-3">
          {plantings.map((p) => <PlantingCard {...p} />)}
        </div>
      )}
    </section>
  </div>
)
