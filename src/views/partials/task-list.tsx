import type { FC } from 'hono/jsx'
import { TaskItem, type TaskItemData } from './task-item'
import { TaskListEmpty } from './task-list-empty'

type DayGroup = {
  label: string
  isToday: boolean
  isPast?: boolean
  tasks: TaskItemData[]
}

type TaskListProps = {
  groups?: DayGroup[]
}

// Completed tasks are hidden from the dashboard.
// Past overdue recurring tasks are hidden (still actionable one_time tasks remain visible).
const filterTasks = (tasks: TaskItemData[], isToday: boolean, isPast?: boolean) =>
  tasks.filter((t) => !t.completedAt && (isToday || !isPast || t.taskType === 'one_time'))

export const TaskList: FC<TaskListProps> = ({ groups = [] }) => {
  const visibleGroups = groups
    .map((g) => ({ ...g, tasks: filterTasks(g.tasks, g.isToday, g.isPast) }))
    .filter((g) => g.tasks.length > 0)

  return (
    <div id="task-list" class="space-y-1">
      {visibleGroups.length === 0 ? (
        <TaskListEmpty />
      ) : (
        visibleGroups.map((group) => (
          <div>
            <div class="divider text-sm text-base-content/50 my-1">{group.label}</div>
            {group.tasks.map((task) => (
              <TaskItem {...task} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
