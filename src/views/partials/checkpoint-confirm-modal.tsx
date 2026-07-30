import type { FC } from 'hono/jsx'

type Props = {
  checkpointId: number
  plantingId: number
  vegetableName: string
  currentStageName: string
  nextStageName: string | null
  /** 多年草などの最終ステージに留まり続ける更新（栽培終了ではない） */
  isOngoing: boolean
  /** 確定すると削除される未完了タスクの名前（isOngoing のときは常に空） */
  pendingTaskNames: string[]
}

export const CheckpointConfirmModal: FC<Props> = ({
  checkpointId,
  plantingId,
  vegetableName,
  currentStageName,
  nextStageName,
  isOngoing,
  pendingTaskNames,
}) => {
  const isFinal = nextStageName === null && !isOngoing
  const dismissFn = "(function(d){d.close();d.remove();})(document.getElementById('checkpoint-modal'))"

  const title = isOngoing ? '収穫を継続しますか？' : isFinal ? '栽培を終了しますか？' : 'ステージを進めますか？'

  return (
    <dialog id="checkpoint-modal" class="modal modal-open" aria-labelledby="modal-title" aria-describedby="modal-warning">
      <div class="modal-box">
        <h3 id="modal-title" class="font-bold text-lg">{title}</h3>
        <p class="py-3">
          <span class="font-medium">{vegetableName}</span>{' '}
          {isOngoing ? (
            <>
              の <span class="badge badge-outline">{currentStageName}</span> を記録します。多年草のため栽培記録はそのまま継続し、タスクも引き続き生成されます。
            </>
          ) : isFinal ? (
            <>
              の <span class="badge badge-outline">{currentStageName}</span> を完了して栽培を終了します。
            </>
          ) : (
            <>
              を <span class="badge badge-outline">{currentStageName}</span> から{' '}
              <span class="badge badge-primary">{nextStageName}</span> に進めます。
            </>
          )}
        </p>
        {!isOngoing && (
          <div id="modal-warning" role="alert" class="alert alert-warning py-2 text-sm flex-col items-start gap-1">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>この操作は取り消せません。</span>
            </div>
            {pendingTaskNames.length > 0 ? (
              <p class="pl-7">
                未完了のタスク「{pendingTaskNames.join('・')}」が削除されます。
              </p>
            ) : (
              <p class="pl-7">削除される未完了タスクはありません。</p>
            )}
          </div>
        )}
        <div class="modal-action">
          <button class="btn" onclick={dismissFn}>キャンセル</button>
          <button
            class="btn btn-primary"
            {...{
              'hx-post': `/checkpoints/${checkpointId}/complete?plantingId=${plantingId}`,
              'hx-disabled-elt': 'this',
              'hx-indicator': '#confirm-spinner',
            }}
          >
            <span id="confirm-spinner" class="loading loading-spinner loading-sm htmx-indicator" />
            確定
          </button>
        </div>
      </div>
      <div class="modal-backdrop" onclick={dismissFn} />
    </dialog>
  )
}
