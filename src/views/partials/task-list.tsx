import type { FC } from 'hono/jsx'
import { TaskItem, type TaskItemData } from './task-item'
import { TaskListEmpty } from './task-list-empty'

type DayGroup = {
  label: string
  tasks: TaskItemData[]
}

type TaskListProps = {
  groups?: DayGroup[]
}

const MOCK_GROUPS: DayGroup[] = [
  {
    label: '今日',
    tasks: [
      { id: 1, taskName: '水やり', vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左', daysBundled: 3 },
      { id: 2, taskName: '収穫', vegetableName: 'きゅうり', spotName: '庭の南区画' },
    ],
  },
  {
    label: '明日',
    tasks: [
      { id: 3, taskName: '追肥', vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左' },
    ],
  },
]

export const TaskList: FC<TaskListProps> = ({ groups = MOCK_GROUPS }) => (
  <div id="task-list" class="space-y-1">
    {groups.length === 0 ? (
      <TaskListEmpty />
    ) : (
      groups.map((group) => (
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
