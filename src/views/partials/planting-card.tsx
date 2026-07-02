import type { FC } from 'hono/jsx'

export type PlantingCardData = {
  id: number
  vegetableName: string
  spotName: string
  stageName: string
  /** stage_master.order_index（1始まり）。ステージ未設定は 0 */
  stageOrder: number
  nextTask?: string
}

const STAGE_BADGE_COLORS = ['badge-ghost', 'badge-info', 'badge-primary', 'badge-warning', 'badge-success']
const stageBadgeColor = (orderIndex: number) => STAGE_BADGE_COLORS[orderIndex - 1] ?? 'badge-ghost'

export const PlantingCard: FC<PlantingCardData> = ({ id, vegetableName, spotName, stageName, stageOrder, nextTask }) => (
  <a
    id={`planting-card-${id}`}
    href={`/plantings/${id}`}
    class="card bg-base-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all block"
  >
    <div class="card-body p-4 gap-2">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-bold">{vegetableName}</h3>
          <p class="text-sm text-base-content/60">{spotName}</p>
        </div>
        <span class={`badge ${stageBadgeColor(stageOrder)} badge-sm shrink-0`}>{stageName}</span>
      </div>
      {nextTask && (
        <p class="text-sm text-base-content/70">スケジュール: {nextTask}</p>
      )}
      <div class="flex justify-end">
        <span class="text-xs text-primary font-medium">詳細を見る →</span>
      </div>
    </div>
  </a>
)
