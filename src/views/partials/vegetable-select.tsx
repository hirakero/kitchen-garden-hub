import type { FC } from 'hono/jsx'

export type VegetableOption = { id: number; name: string }

// 絞り込み結果で差し替えられる select（htmx target）
export const VegetableSelect: FC<{ vegetables: VegetableOption[] }> = ({ vegetables }) => (
  <select id="vegetable_id" name="vegetable_id" class="select select-bordered w-full" required>
    {vegetables.length === 0 ? (
      <option value="">該当する植物がありません</option>
    ) : (
      <>
        <option value="">-- 植物を選んでください --</option>
        {vegetables.map((v) => (
          <option value={v.id}>{v.name}</option>
        ))}
      </>
    )}
  </select>
)
