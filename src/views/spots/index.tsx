import type { FC } from 'hono/jsx'
import { SpotList, type SpotCardData } from '../partials/spot-list'

type SpotsPageProps = {
  spots?: SpotCardData[]
  error?: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_name: 'スポット名を入力してください。',
}

export const SpotsPage: FC<SpotsPageProps> = ({ spots = [], error }) => (
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">栽培スポット</h1>
    </div>

    <SpotList spots={spots} />

    <div id="add-spot" class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <h2 class="card-title text-base">スポットを追加</h2>
        {error && (
          <div role="alert" class="alert alert-error py-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{ERROR_MESSAGES[error] ?? '入力内容を確認してください。'}</span>
          </div>
        )}
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
