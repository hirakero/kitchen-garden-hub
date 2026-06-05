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
      <div role="alert" class="alert alert-warning py-2 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>前ステージの未完了タスクは削除されます。この操作は取り消せません。</span>
      </div>
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
