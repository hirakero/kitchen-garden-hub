import type { FC } from 'hono/jsx'

export type CheckpointItemData = {
  id: number
  name: string
  completedAt?: string
  isCurrent?: boolean
  plantingId?: number
}

const CheckpointItem: FC<CheckpointItemData> = ({ id, name, completedAt, isCurrent, plantingId }) => (
  <div class={`rounded-lg ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}`}>
    {isCurrent ? (
      <button
        class="flex items-center gap-3 p-3 w-full text-left cursor-pointer active:bg-primary/20 transition-colors"
        aria-label={`${name} を完了にする`}
        {...{ 'hx-get': `/checkpoints/${id}/confirm?plantingId=${plantingId ?? ''}`, 'hx-target': '#modal-container', 'hx-swap': 'innerHTML' }}
      >
        <div class="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0" />
        <div class="flex-1">
          <div class="font-medium">{name}</div>
        </div>
        <span class="text-primary text-sm font-medium shrink-0">完了にする →</span>
      </button>
    ) : (
      <div class="flex items-center gap-3 p-3">
        <div class={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
          ${completedAt ? 'border-success bg-success text-success-content' : 'border-base-300'}`}>
          {completedAt && <span class="text-xs">✓</span>}
        </div>
        <div class="flex-1">
          <div class={`font-medium ${completedAt ? 'line-through text-base-content/40' : 'text-base-content/50'}`}>{name}</div>
          {completedAt && <div class="text-xs text-base-content/40">完了: {completedAt}</div>}
        </div>
      </div>
    )}
  </div>
)

type CheckpointListProps = {
  checkpoints?: CheckpointItemData[]
}

export const CheckpointList: FC<CheckpointListProps> = ({ checkpoints = [] }) => (
  <div id="checkpoint-list" class="space-y-1">
    {checkpoints.map((cp) => <CheckpointItem {...cp} />)}
  </div>
)
