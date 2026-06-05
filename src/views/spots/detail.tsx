import type { FC } from 'hono/jsx'
import { PlantingCard } from '../partials/planting-card'

type SpotDetailProps = {
  id?: number
  name?: string
  type?: 'ground' | 'planter'
}

const typeLabel = { ground: '地植え', planter: 'プランター' }

export const SpotDetailPage: FC<SpotDetailProps> = ({
  id = 1,
  name = 'ベランダプランター左',
  type = 'planter',
}) => (
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <a href="/spots" class="btn btn-ghost btn-sm">← 戻る</a>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">{name}</h1>
          <span class="text-sm text-base-content/50 bg-base-200 rounded px-2 py-0.5">{typeLabel[type]}</span>
        </div>
      </div>
    </div>

    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">栽培中の野菜</h2>
        <a href={`/spots/${id}/plantings/new`} class="btn btn-primary btn-sm">+ 野菜を植える</a>
      </div>
      <div class="space-y-3">
        <PlantingCard id={1} vegetableName="ミニトマト1号鉢" spotName={name} stageName="生育・着果" stageOrder={3} nextTask="水やり (今日)" />
        <PlantingCard id={2} vegetableName="ミニトマト2号鉢" spotName={name} stageName="定植" stageOrder={2} nextTask="支柱立て (昨日)" />
      </div>
    </section>
  </div>
)
