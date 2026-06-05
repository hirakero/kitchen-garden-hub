import type { FC } from 'hono/jsx'

export type TaskItemData = {
  id: number
  taskName: string
  vegetableName: string
  spotName: string
  daysBundled?: number
  taskType: 'one_time' | 'recurring'
  completedAt?: number | null
}

export const TaskItem: FC<TaskItemData> = ({ id, taskName, vegetableName, spotName, daysBundled = 1, completedAt }) => {
  const done = !!completedAt
  return (
    <div class={`flex items-start gap-3 p-3 rounded-lg transition-colors ${done ? 'opacity-40' : 'hover:bg-base-200'}`}>
      <input
        type="checkbox"
        class="checkbox checkbox-primary mt-0.5"
        checked={done}
        disabled={done}
        {...(!done ? { 'hx-post': `/tasks/${id}/complete`, 'hx-target': '#task-list', 'hx-swap': 'outerHTML' } : {})}
      />
      <div class="flex-1 min-w-0">
        <div class={`font-medium ${done ? 'line-through' : ''}`}>{taskName}</div>
        <div class="text-sm text-base-content/60 truncate">{vegetableName} · {spotName}</div>
      </div>
      {!done && daysBundled != null && daysBundled >= 2 && (
        <span class="badge badge-warning badge-sm shrink-0">{daysBundled}日分まとめて</span>
      )}
    </div>
  )
}
