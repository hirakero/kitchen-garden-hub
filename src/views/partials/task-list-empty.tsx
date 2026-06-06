import type { FC } from 'hono/jsx'

export const TaskListEmpty: FC = () => (
  <div class="alert alert-info">
    <span>今日のタスクはありません。ゆっくり休みましょう 🌱</span>
  </div>
)
