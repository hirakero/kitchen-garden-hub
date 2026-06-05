import { Hono } from 'hono'
import type { AppType } from '../app'
import { Layout } from '../views/layouts/base'
import { SpotsPage } from '../views/spots/index'
import { SpotDetailPage } from '../views/spots/detail'
import { NewPlantingPage } from '../views/plantings/new'

const route = new Hono<AppType>()

route.get('/', (c) => {
  return c.html(
    <Layout title="栽培スポット">
      <SpotsPage />
    </Layout>
  )
})

route.post('/', async (c) => {
  // TODO: DB insert
  return c.redirect('/spots')
})

route.get('/:id', (c) => {
  const id = Number(c.req.param('id'))
  return c.html(
    <Layout title="スポット詳細">
      <SpotDetailPage id={id} />
    </Layout>
  )
})

route.get('/:id/plantings/new', (c) => {
  const id = Number(c.req.param('id'))
  return c.html(
    <Layout title="野菜を植える">
      <NewPlantingPage spotId={id} />
    </Layout>
  )
})

route.post('/:id/plantings', async (c) => {
  // TODO: DB insert + task schedule generation
  const id = c.req.param('id')
  return c.redirect(`/spots/${id}`)
})

export default route
