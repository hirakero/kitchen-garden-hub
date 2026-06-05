import type { FC } from 'hono/jsx'

type Props = {
  hasSpots?: boolean
  firstSpotId?: number
}

export const PlantingCardListEmpty: FC<Props> = ({ hasSpots = false, firstSpotId }) => (
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body items-center text-center gap-3 py-8">
      <div class="text-4xl">🪴</div>
      {hasSpots ? (
        <>
          <p class="text-base-content/70">スポットはありますが、まだ野菜が植えられていません</p>
          <a href={firstSpotId ? `/spots/${firstSpotId}/plantings/new` : '/spots'} class="btn btn-primary btn-sm">
            + 野菜を植える
          </a>
        </>
      ) : (
        <>
          <p class="text-base-content/70">まだ栽培スポットがありません</p>
          <a href="/spots" class="btn btn-primary btn-sm">+ スポットを追加する</a>
        </>
      )}
    </div>
  </div>
)
