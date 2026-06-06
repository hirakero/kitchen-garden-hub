import type { FC } from 'hono/jsx'

export type TaskItemData = {
  id: number
  taskName: string
  vegetableName: string
  spotName: string
  taskType: 'one_time' | 'recurring'
  completedAt?: number | null
  isPast?: boolean
  plantingId?: number
}

export const TaskItem: FC<TaskItemData> = ({ id, taskName, vegetableName, spotName, taskType, completedAt, isPast }) => {
  const done = !!completedAt
  const showSkip = isPast && taskType === 'one_time' && !done
  return (
    <div class={`flex items-center gap-2 p-3 rounded-lg transition-colors ${done ? 'opacity-40' : 'hover:bg-base-200'}`}>
      <label class={`flex items-center gap-3 flex-1 min-w-0 ${!done ? 'cursor-pointer' : ''}`}>
        <input
          type="checkbox"
          class="checkbox checkbox-primary shrink-0"
          checked={done}
          disabled={done}
          {...(!done ? {
            'hx-post': `/tasks/${id}/complete`,
            'hx-target': '#task-list',
            'hx-swap': 'outerHTML',
          } : {})}
        />
        <div class="flex-1 min-w-0">
          <div class={`font-medium ${done ? 'line-through' : ''}`}>{taskName}</div>
          <div class="text-sm text-base-content/60 truncate">{vegetableName} · {spotName}</div>
        </div>
      </label>
      {showSkip && (
        <button
          class="btn btn-ghost btn-xs text-base-content/40 shrink-0"
          {...{
            'hx-post': `/tasks/${id}/skip`,
            'hx-target': '#task-list',
            'hx-swap': 'outerHTML',
            'hx-disabled-elt': 'this',
          }}
        >
          スキップ
        </button>
      )}
    </div>
  )
}
