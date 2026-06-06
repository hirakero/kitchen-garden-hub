import { Hono } from 'hono'
import { eq, and, isNull, asc, desc, sql } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import { spots, plantings, vegetableMaster, stageMaster } from '../db/schema'
import { Layout } from '../views/layouts/base'
import { SpotsPage } from '../views/spots/index'
import { SpotDetailPage } from '../views/spots/detail'
import { NewPlantingPage } from '../views/plantings/new'

const route = new Hono<AppType>()

route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id

  const spotsData = await db
    .select({
      id: spots.id,
      name: spots.name,
      type: spots.type,
      plantingCount: sql<number>`cast(count(case when ${plantings.finishedAt} is null then 1 end) as integer)`,
    })
    .from(spots)
    .leftJoin(plantings, eq(plantings.spotId, spots.id))
    .where(eq(spots.userId, userId))
    .groupBy(spots.id)
    .orderBy(desc(spots.createdAt))

  return c.html(
    <Layout title="栽培スポット">
      <SpotsPage spots={spotsData} />
    </Layout>
  )
})

route.post('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const type = body.type === 'ground' ? 'ground' : 'planter'
  if (!name) return c.redirect('/spots')

  await db.insert(spots).values({ userId, name, type })
  return c.redirect('/spots')
})

route.get('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  const spot = await db
    .select()
    .from(spots)
    .where(and(eq(spots.id, id), eq(spots.userId, userId)))
    .get()
  if (!spot) return c.notFound()

  const spotPlantings = await db
    .select({
      id: plantings.id,
      vegetableName: vegetableMaster.name,
      stageName: stageMaster.name,
      stageOrder: stageMaster.orderIndex,
    })
    .from(plantings)
    .innerJoin(vegetableMaster, eq(plantings.vegetableId, vegetableMaster.id))
    .leftJoin(stageMaster, eq(plantings.currentStageId, stageMaster.id))
    .where(and(eq(plantings.spotId, id), eq(plantings.userId, userId), isNull(plantings.finishedAt)))
    .orderBy(desc(plantings.createdAt))

  const plantingCards = spotPlantings.map((p) => ({
    id: p.id,
    vegetableName: p.vegetableName,
    spotName: spot.name,
    stageName: p.stageName ?? '—',
    stageOrder: Math.max(0, (p.stageOrder ?? 1) - 1), // 1-indexed → 0-indexed for badge colors
  }))

  return c.html(
    <Layout title={spot.name}>
      <SpotDetailPage
        id={spot.id}
        name={spot.name}
        type={spot.type}
        plantings={plantingCards}
      />
    </Layout>
  )
})

route.get('/:id/plantings/new', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  const spot = await db
    .select()
    .from(spots)
    .where(and(eq(spots.id, id), eq(spots.userId, userId)))
    .get()
  if (!spot) return c.notFound()

  const vegetables = await db
    .select({ id: vegetableMaster.id, name: vegetableMaster.name })
    .from(vegetableMaster)
    .orderBy(asc(vegetableMaster.id))

  return c.html(
    <Layout title="野菜を植える">
      <NewPlantingPage spotId={spot.id} spotName={spot.name} vegetables={vegetables} />
    </Layout>
  )
})

route.post('/:id/plantings', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const spotId = Number(c.req.param('id'))

  const spot = await db
    .select()
    .from(spots)
    .where(and(eq(spots.id, spotId), eq(spots.userId, userId)))
    .get()
  if (!spot) return c.notFound()

  const body = await c.req.parseBody()
  const vegetableId = Number(body.vegetable_id)
  const plantedAtStr = String(body.planted_at ?? '')
  const notes = String(body.notes ?? '').trim() || null

  if (!vegetableId || !plantedAtStr) return c.redirect(`/spots/${spotId}/plantings/new`)

  const firstStage = await db
    .select({ id: stageMaster.id })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, vegetableId))
    .orderBy(asc(stageMaster.orderIndex))
    .limit(1)
    .get()

  await db.insert(plantings).values({
    userId,
    spotId,
    vegetableId,
    currentStageId: firstStage?.id ?? null,
    plantedAt: new Date(plantedAtStr),
    notes,
  })

  return c.redirect(`/spots/${spotId}`)
})

export default route
