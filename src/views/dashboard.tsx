import type { FC } from 'hono/jsx'
import { TaskList } from './partials/task-list'
import { PlantingCardList } from './partials/planting-card-list'

export const DashboardPage: FC = () => (
  <div class="space-y-6">
    <div class="lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 space-y-6">
      <section>
        <h2 class="text-lg font-bold mb-3">📋 今後3日のタスク</h2>
        <TaskList />
      </section>
      <section>
        <h2 class="text-lg font-bold mb-3">🪴 栽培中の野菜</h2>
        <PlantingCardList />
      </section>
    </div>
  </div>
)
