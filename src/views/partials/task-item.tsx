import type { FC } from 'hono/jsx'

export type TaskItemData = {
  id: number
  taskName: string
  vegetableName: string
  spotName: string
  daysBundled?: number
}

export const TaskItem: FC<TaskItemData> = ({ id, taskName, vegetableName, spotName, daysBundled = 1 }) => (
  <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors">
    <input
      type="checkbox"
      class="checkbox checkbox-primary mt-0.5"
      {...{ 'hx-post': `/tasks/${id}/complete`, 'hx-target': '#task-list', 'hx-swap': 'outerHTML' }}
    />
    <div class="flex-1 min-w-0">
      <div class="font-medium">{taskName}</div>
      <div class="text-sm text-base-content/60 truncate">{vegetableName} · {spotName}</div>
    </div>
    {daysBundled >= 2 && (
      <span class="badge badge-warning badge-sm shrink-0">{daysBundled}日分まとめて</span>
    )}
  </div>
)
