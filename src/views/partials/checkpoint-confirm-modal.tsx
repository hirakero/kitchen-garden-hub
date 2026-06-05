import type { FC } from 'hono/jsx'

type Props = {
  checkpointId: number
  vegetableName: string
  currentStageName: string
  nextStageName: string
}

export const CheckpointConfirmModal: FC<Props> = ({
  checkpointId,
  vegetableName,
  currentStageName,
  nextStageName,
}) => (
  <dialog id="checkpoint-modal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">ステージを進めますか？</h3>
      <p class="py-3">
        <span class="font-medium">{vegetableName}</span> を{' '}
        <span class="badge badge-outline">{currentStageName}</span> から{' '}
        <span class="badge badge-primary">{nextStageName}</span> に進めます。
      </p>
      <p class="text-sm text-warning">⚠ 前ステージの未完了タスクは削除されます。この操作は取り消せません。</p>
      <div class="modal-action">
        <button
          class="btn"
          onclick="document.getElementById('checkpoint-modal').remove()"
        >
          キャンセル
        </button>
        <button
          class="btn btn-primary"
          {...{
            'hx-post': `/checkpoints/${checkpointId}/complete`,
            'hx-target': '#checkpoint-list',
            'hx-swap': 'outerHTML',
            'hx-on--after-request': "document.getElementById('checkpoint-modal').remove()",
          }}
        >
          確定
        </button>
      </div>
    </div>
    <div class="modal-backdrop" onclick="document.getElementById('checkpoint-modal').remove()"></div>
  </dialog>
)
