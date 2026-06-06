import type { FC } from 'hono/jsx'
import { PlantingCard, type PlantingCardData } from './planting-card'
import { PlantingCardListEmpty } from './planting-card-list-empty'

type PlantingCardListProps = {
  plantings?: PlantingCardData[]
  hasSpots?: boolean
  firstSpotId?: number
}

export const PlantingCardList: FC<PlantingCardListProps> = ({
  plantings = [],
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
