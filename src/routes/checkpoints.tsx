import { Hono } from 'hono'
import type { AppType } from '../app'
import { CheckpointConfirmModal } from '../views/partials/checkpoint-confirm-modal'
import { CheckpointList } from '../views/partials/checkpoint-list'

const route = new Hono<AppType>()

// HTMX: チェックポイントタップ → 確認モーダルを返す
route.get('/:id/confirm', (c) => {
  const id = Number(c.req.param('id'))
  return c.html(
    <CheckpointConfirmModal
      checkpointId={id}
      vegetableName="ミニトマト1号鉢"
      currentStageName="定植"
      nextStageName="生育・着果"
    />
  )
})

// HTMX: ステージ進行確定 → checkpoint-list + stage-progress(OOB) を返す
route.post('/:id/complete', async (c) => {
  // TODO: DB update + task schedule generation
  return c.html(<CheckpointList />)
})

export default route
