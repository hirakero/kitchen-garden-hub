import { Hono } from 'hono'
import type { AppType } from '../app'
import { Layout } from '../views/layouts/base'
import { PlantingDetailPage } from '../views/plantings/detail'
import { PlantingCard } from '../views/partials/planting-card'

const route = new Hono<AppType>()

route.get('/:id', (c) => {
  const id = Number(c.req.param('id'))
  return c.html(
    <Layout title="栽培記録詳細">
      <PlantingDetailPage id={id} />
    </Layout>
  )
})

// HTMX: 野菜カードの展開/折りたたみ
route.get('/:id/card', (c) => {
  const id = Number(c.req.param('id'))
  return c.html(
    <PlantingCard
      id={id}
      vegetableName="ミニトマト1号鉢"
      spotName="ベランダプランター左"
      stageName="生育・着果"
      nextTask="水やり (今日)"
    />
  )
})

export default route
