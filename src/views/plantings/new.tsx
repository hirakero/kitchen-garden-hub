import type { FC } from 'hono/jsx'

type VegetableOption = {
  id: number
  name: string
}

type NewPlantingPageProps = {
  spotId: number
  spotName: string
  vegetables: VegetableOption[]
}

export const NewPlantingPage: FC<NewPlantingPageProps> = ({ spotId, spotName, vegetables }) => (
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <a href={`/spots/${spotId}`} class="btn btn-ghost btn-sm">← {spotName}</a>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4 space-y-4">
        <h1 class="card-title">野菜を植える</h1>
        <p class="text-sm text-base-content/60">スポット: {spotName}</p>

        <form action={`/spots/${spotId}/plantings`} method="post" class="space-y-4">
          <div class="form-control gap-1">
            <label class="label" for="vegetable_id">
              <span class="label-text font-medium">野菜を選択</span>
            </label>
            <select id="vegetable_id" name="vegetable_id" class="select select-bordered w-full" required>
              <option value="">-- 野菜を選んでください --</option>
              {vegetables.map((v) => (
                <option value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div class="form-control gap-1">
            <label class="label" for="planted_at">
              <span class="label-text font-medium">植えた日</span>
            </label>
            <input
              id="planted_at"
              name="planted_at"
              type="date"
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
