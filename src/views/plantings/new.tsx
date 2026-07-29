import type { FC } from 'hono/jsx'
import { VegetableSelect, type VegetableOption } from '../partials/vegetable-select'

const CATEGORY_TABS = [
  { value: '', label: 'すべて' },
  { value: 'vegetable', label: '野菜' },
  { value: 'fruit', label: '果物' },
]

// 絞り込みトリガー共通のhtmx属性（カテゴリタブ・検索入力で対になる入力値を hx-include で同送する）
const filterHx = (spotId: number, extra: Record<string, string>) => ({
  'hx-get': `/spots/${spotId}/plantings/vegetable-options`,
  'hx-target': '#vegetable_id',
  'hx-swap': 'outerHTML',
  ...extra,
})

type NewPlantingPageProps = {
  spotId: number
  spotName: string
  vegetables: VegetableOption[]
  defaultDate?: string
  error?: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: '野菜と日付を正しく入力してください。',
}

export const NewPlantingPage: FC<NewPlantingPageProps> = ({
  spotId,
  spotName,
  vegetables,
  defaultDate,
  error,
}) => (
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <a href={`/spots/${spotId}`} class="btn btn-ghost btn-sm">← {spotName}</a>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4 space-y-4">
        <h1 class="card-title">野菜を植える</h1>
        <p class="text-sm text-base-content/60">スポット: {spotName}</p>

        {error && (
          <div role="alert" class="alert alert-error py-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{ERROR_MESSAGES[error] ?? '入力内容を確認してください。'}</span>
          </div>
        )}

        <form action={`/spots/${spotId}/plantings`} method="post" class="space-y-4">
          <div class="form-control gap-2">
            <label class="label" for="vegetable_id">
              <span class="label-text font-medium">植物を選択</span>
            </label>
            <div class="join" role="group" aria-label="カテゴリで絞り込み">
              {CATEGORY_TABS.map((tab) => (
                <input
                  type="radio"
                  name="category"
                  value={tab.value}
                  aria-label={tab.label}
                  class="join-item btn btn-sm"
                  checked={tab.value === ''}
                  {...filterHx(spotId, { 'hx-include': "input[name='q']" })}
                />
              ))}
            </div>
            <input
              type="search"
              name="q"
              placeholder="名前で絞り込み（例: トマト）"
              class="input input-bordered w-full"
              {...filterHx(spotId, {
                'hx-trigger': 'input changed delay:300ms, search',
                'hx-include': "input[name='category']:checked",
              })}
            />
            <VegetableSelect vegetables={vegetables} />
          </div>

          <div class="form-control gap-1">
            <label class="label" for="planted_at">
              <span class="label-text font-medium">植えた日</span>
            </label>
            <input
              id="planted_at"
              name="planted_at"
              type="date"
              value={defaultDate}
              max={defaultDate}
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control gap-1">
            <label class="label" for="notes">
              <span class="label-text font-medium">メモ（任意）</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              class="textarea textarea-bordered w-full"
              placeholder="品種名など"
              rows={2}
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary w-full">植える 🌱</button>
        </form>
      </div>
    </div>
  </div>
)
