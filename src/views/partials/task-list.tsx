import type { FC } from 'hono/jsx'
import { TaskItem, type TaskItemData } from './task-item'
import { TaskListEmpty } from './task-list-empty'

type DayGroup = {
  label: string
  isToday: boolean
  tasks: TaskItemData[]
}

type TaskListProps = {
  groups?: DayGroup[]
}

const MOCK_GROUPS: DayGroup[] = [
  {
    label: '昨日',
    isToday: false,
    tasks: [
      // recurring の期限切れは非表示になる
      { id: 10, taskName: '水やり', vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左', taskType: 'recurring' },
      // one_time は期限切れでも表示
      { id: 11, taskName: '芽かき', vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左', taskType: 'one_time' },
      // 完了済みは faded で表示
      { id: 12, taskName: '水やり', vegetableName: 'きゅうり', spotName: '庭の南区画', taskType: 'recurring', completedAt: 1 },
    ],
  },
  {
    label: '今日',
    isToday: true,
    tasks: [
      { id: 1, taskName: '水やり', vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左', taskType: 'recurring', daysBundled: 3 },
      { id: 2, taskName: '収穫', vegetableName: 'きゅうり', spotName: '庭の南区画', taskType: 'one_time' },
    ],
  },
  {
    label: '明日',
    isToday: false,
    tasks: [
      { id: 3, taskName: '追肥', vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左', taskType: 'recurring' },
    ],
  },
]

// 期限切れの recurring 未完了タスクは非表示
const filterTasks = (tasks: TaskItemData[], isToday: boolean) =>
  tasks.filter((t) => t.completedAt || isToday || t.taskType === 'one_time')

export const TaskList: FC<TaskListProps> = ({ groups = MOCK_GROUPS }) => {
  const visibleGroups = groups
    .map((g) => ({ ...g, tasks: filterTasks(g.tasks, g.isToday) }))
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
