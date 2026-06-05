import type { FC } from 'hono/jsx'

export type CheckpointItemData = {
  id: number
  name: string
  completedAt?: string
  isCurrent?: boolean
}

const CheckpointItem: FC<CheckpointItemData> = ({ id, name, completedAt, isCurrent }) => (
  <div
    class={`flex items-center gap-3 p-3 rounded-lg ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}`}
    {...(isCurrent
      ? { 'hx-get': `/checkpoints/${id}/confirm`, 'hx-target': '#modal-container', 'hx-swap': 'innerHTML' }
      : {})}
  >
    <div class={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
      ${completedAt ? 'border-primary bg-primary text-primary-content' : isCurrent ? 'border-primary' : 'border-base-300'}`}>
      {completedAt && <span class="text-xs">✓</span>}
    </div>
    <div class="flex-1">
      <div class={`font-medium ${completedAt ? 'line-through text-base-content/40' : ''}`}>{name}</div>
      {completedAt && <div class="text-xs text-base-content/40">完了: {completedAt}</div>}
    </div>
    {isCurrent && (
      <button
        class="btn btn-primary btn-xs cursor-pointer"
        {...{ 'hx-get': `/checkpoints/${id}/confirm`, 'hx-target': '#modal-container', 'hx-swap': 'innerHTML' }}
      >
        完了にする
      </button>
    )}
  </div>
)

type CheckpointListProps = {
  checkpoints?: CheckpointItemData[]
}

const MOCK_CHECKPOINTS: CheckpointItemData[] = [
  { id: 1, name: '発芽を確認した', completedAt: '2026-05-01' },
  { id: 2, name: '本葉4〜5枚になった', completedAt: '2026-05-15' },
  { id: 3, name: '定植した', completedAt: '2026-06-01' },
  { id: 4, name: '実が赤くなり始めた', isCurrent: true },
  { id: 5, name: '収穫を終了した' },
]

export const CheckpointList: FC<CheckpointListProps> = ({ checkpoints = MOCK_CHECKPOINTS }) => (
  <div id="checkpoint-list" class="space-y-1">
    {checkpoints.map((cp) => <CheckpointItem {...cp} />)}
  </div>
)
