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
  isFinished: boolean
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
  isFinished,
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

      {isFinished && (
        <div role="alert" class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>栽培が完了しました！お疲れ様でした。</span>
        </div>
      )}

      <section id="stage-progress" class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 space-y-3">
          <h2 class="font-bold">現在のステージ</h2>
          <div class="overflow-x-auto">
            <ul class="steps steps-horizontal min-w-max text-xs px-1">
              {stages.map((stage, i) => {
                const isDone = isFinished || i < currentStageIndex
                const isCurrent = !isFinished && i === currentStageIndex
                return (
                  <li class={`step ${isDone ? 'step-success' : isCurrent ? 'step-primary' : ''}`}>
                    {stage.name}
                  </li>
                )
              })}
            </ul>
          </div>
          {!isFinished && (
            <p class="text-sm text-center">
              現在: <span class="badge badge-primary">{currentStageName}</span>
            </p>
          )}
        </div>
      </section>

      {!isFinished && (
        <section class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 space-y-3">
            <h2 class="font-bold">チェックポイント</h2>
            <p class="text-xs text-base-content/50">完了したら次のステージに進みます（確認モーダルが表示されます）</p>
            <CheckpointList checkpoints={checkpoints} />
          </div>
        </section>
      )}

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
