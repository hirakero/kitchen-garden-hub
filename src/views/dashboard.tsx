import type { FC } from 'hono/jsx'
import { TaskList } from './partials/task-list'
import { PlantingCardList } from './partials/planting-card-list'
import type { TaskItemData } from './partials/task-item'
import type { PlantingCardData } from './partials/planting-card'

type DayGroup = { label: string; isToday: boolean; tasks: TaskItemData[] }

type DashboardPageProps = {
  groups?: DayGroup[]
  plantings?: PlantingCardData[]
  hasSpots?: boolean
  firstSpotId?: number
}

export const DashboardPage: FC<DashboardPageProps> = ({ groups = [], plantings = [], hasSpots, firstSpotId }) => (
  <div class="space-y-6">
    <h1 class="sr-only">ダッシュボード</h1>
    <div class="lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 space-y-6">
      <section>
        <h2 class="text-lg font-bold mb-3">今後3日のタスク</h2>
        <TaskList groups={groups} />
      </section>
      <section>
        <h2 class="text-lg font-bold mb-3">栽培中の野菜</h2>
        <PlantingCardList plantings={plantings} hasSpots={hasSpots} firstSpotId={firstSpotId} />
      </section>
    </div>
  </div>
)
