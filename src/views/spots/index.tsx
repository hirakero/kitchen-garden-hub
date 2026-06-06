import type { FC } from 'hono/jsx'
import { SpotList, type SpotCardData } from '../partials/spot-list'

type SpotsPageProps = {
  spots?: SpotCardData[]
}

export const SpotsPage: FC<SpotsPageProps> = ({ spots = [] }) => (
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">栽培スポット</h1>
    </div>

    <SpotList spots={spots} />

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <h2 class="card-title text-base">スポットを追加</h2>
        <form action="/spots" method="post" class="space-y-3">
          <div class="form-control">
            <input
              name="name"
              type="text"
              placeholder="スポット名（例: ベランダプランター左）"
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control">
            <select name="type" class="select select-bordered w-full">
              <option value="planter">プランター・鉢</option>
              <option value="ground">地植え（畑・庭）</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary w-full">追加する</button>
        </form>
      </div>
    </div>
  </div>
)
