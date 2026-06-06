import type { FC } from 'hono/jsx'
import { CheckpointList, type CheckpointItemData } from '../partials/checkpoint-list'

type StageInfo = { id: number; name: string; orderIndex: number }
type HistoryEntry = { date: string; task: string }

type PlantingDetailPageProps = {
  id: number
  vegetableName: string
  spotName: string
  spotId: number
  stages: StageInfo[]
  currentStageId: number | null
  checkpoints: CheckpointItemData[]
  recentHistory: HistoryEntry[]
}

export const PlantingDetailPage: FC<PlantingDetailPageProps> = ({
  id,
  vegetableName,
  spotName,
  spotId,
  stages,
  currentStageId,
  checkpoints,
  recentHistory,
}) => {
  const currentStageIndex = currentStageId != null ? stages.findIndex((s) => s.id === currentStageId) : -1
  const currentStageName = stages[currentStageIndex]?.name ?? '—'

  return (
    <div class="space-y-6">
      <div class="flex items-center gap-2">
        <a href={`/spots/${spotId}`} class="btn btn-ghost btn-sm">← {spotName}</a>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h1 class="text-xl font-bold">{vegetableName}</h1>
          <p class="text-sm text-base-content/60">{spotName}</p>
        </div>
      </div>

      <section class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 space-y-3">
          <h2 class="font-bold">現在のステージ</h2>
          <div id="stage-progress" class="overflow-x-auto">
            <ul class="steps steps-horizontal w-full text-xs">
              {stages.map((stage, i) => (
                <li class={`step ${i < currentStageIndex ? 'step-success' : i === currentStageIndex ? 'step-primary' : ''}`}>
                  {stage.name}
                </li>
              ))}
            </ul>
          </div>
          <p class="text-sm text-center">
            現在: <span class="badge badge-primary">{currentStageName}</span>
          </p>
        </div>
      </section>

      <section class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 space-y-3">
          <h2 class="font-bold">チェックポイント</h2>
          <p class="text-xs text-base-content/50">完了したら次のステージに進みます（確認モーダルが表示されます）</p>
          <CheckpointList checkpoints={checkpoints} />
        </div>
      </section>

      {recentHistory.length > 0 && (
        <section class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 space-y-2">
            <h2 class="font-bold">直近の作業履歴</h2>
            <div class="space-y-1">
              {recentHistory.map((h) => (
                <div class="flex gap-3 text-sm">
                  <span class="text-base-content/40 shrink-0">{h.date}</span>
                  <span>{h.task}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
