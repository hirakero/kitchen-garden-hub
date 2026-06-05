import type { FC } from 'hono/jsx'
import { PlantingCard, type PlantingCardData } from './planting-card'
import { PlantingCardListEmpty } from './planting-card-list-empty'

type PlantingCardListProps = {
  plantings?: PlantingCardData[]
  hasSpots?: boolean
  firstSpotId?: number
}

const MOCK_PLANTINGS: PlantingCardData[] = [
  { id: 1, vegetableName: 'ミニトマト1号鉢', spotName: 'ベランダプランター左', stageName: '生育・着果', nextTask: '水やり (今日)' },
  { id: 2, vegetableName: 'きゅうり', spotName: '庭の南区画', stageName: '収穫期', nextTask: '収穫 (今日)' },
]

export const PlantingCardList: FC<PlantingCardListProps> = ({
  plantings = MOCK_PLANTINGS,
  hasSpots,
  firstSpotId,
}) => (
  <div id="planting-card-list" class="space-y-3">
    {plantings.length === 0 ? (
      <PlantingCardListEmpty hasSpots={hasSpots} firstSpotId={firstSpotId} />
    ) : (
      plantings.map((p) => <PlantingCard {...p} />)
    )}
  </div>
)
