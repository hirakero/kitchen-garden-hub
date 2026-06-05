import type { FC } from 'hono/jsx'

export type PlantingCardData = {
  id: number
  vegetableName: string
  spotName: string
  stageName: string
  nextTask?: string
}

export const PlantingCard: FC<PlantingCardData> = ({ id, vegetableName, spotName, stageName, nextTask }) => (
  <div id={`planting-card-${id}`} class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
    <div class="card-body p-4 gap-2">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-bold">{vegetableName}</h3>
          <p class="text-sm text-base-content/60">{spotName}</p>
        </div>
        <span class="badge badge-primary badge-sm shrink-0">{stageName}</span>
      </div>
      {nextTask && (
        <p class="text-sm text-base-content/70">次のタスク: {nextTask}</p>
      )}
      <div class="card-actions justify-end">
        <a href={`/plantings/${id}`} class="btn btn-ghost btn-xs">詳細 →</a>
      </div>
    </div>
  </div>
)
