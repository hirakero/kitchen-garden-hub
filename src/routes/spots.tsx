import { Hono } from 'hono'
import { eq, and, isNull, asc, desc, like, sql, type SQL } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb, type Db } from '../db'
import { spots, plantings, vegetableMaster, stageMaster } from '../db/schema'
import { generateTaskSchedules } from '../lib/task-scheduler'
import { todayJstDateKey } from '../lib/date'
import { positiveInt } from '../lib/params'
import { Layout } from '../views/layouts/base'
import { SpotsPage } from '../views/spots/index'
import { SpotDetailPage } from '../views/spots/detail'
import { NewPlantingPage } from '../views/plantings/new'
import { VegetableSelect } from '../views/partials/vegetable-select'

const CATEGORIES = ['vegetable', 'fruit'] as const
type Category = (typeof CATEGORIES)[number]

// 本人所有のスポットを取得（全ハンドラー共通の所有チェック）
function findSpotOwned(db: Db, id: number, userId: string) {
  return db
    .select()
    .from(spots)
    .where(and(eq(spots.id, id), eq(spots.userId, userId)))
    .get()
}

function searchVegetables(db: Db, q: string, category: string) {
  const conds: SQL[] = []
  if (q) conds.push(like(vegetableMaster.name, `%${q}%`))
  if ((CATEGORIES as readonly string[]).includes(category)) {
    conds.push(eq(vegetableMaster.category, category as Category))
  }
  return db
    .select({ id: vegetableMaster.id, name: vegetableMaster.name })
    .from(vegetableMaster)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(asc(vegetableMaster.id))
}

const route = new Hono<AppType>()

route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const error = c.req.query('error') ?? null

  const spotsData = await db
    .select({
      id: spots.id,
      name: spots.name,
      type: spots.type,
      // Filter plantings by userId in the JOIN to prevent cross-user count leakage
      plantingCount: sql<number>`cast(count(case when ${plantings.finishedAt} is null and ${plantings.userId} = ${userId} then 1 end) as integer)`,
    })
    .from(spots)
    .leftJoin(plantings, eq(plantings.spotId, spots.id))
    .where(eq(spots.userId, userId))
    .groupBy(spots.id)
    .orderBy(desc(spots.createdAt))

  return c.html(
    <Layout title="栽培スポット">
      <SpotsPage spots={spotsData} error={error} />
    </Layout>
  )
})

route.post('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const type = body.type === 'ground' ? 'ground' : 'planter'
  if (!name) return c.redirect('/spots?error=missing_name')

  await db.insert(spots).values({ userId, name, type })
  return c.redirect('/spots')
})

route.get('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = positiveInt(c.req.param('id'))
  if (id === null) return c.notFound()

  const spot = await findSpotOwned(db, id, userId)
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
    stageOrder: p.stageOrder ?? 0,
  }))

  return c.html(
    <Layout title={spot.name}>
      <SpotDetailPage id={spot.id} name={spot.name} type={spot.type} plantings={plantingCards} />
    </Layout>
  )
})

route.get('/:id/plantings/new', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = positiveInt(c.req.param('id'))
  const error = c.req.query('error') ?? null
  if (id === null) return c.notFound()

  const spot = await findSpotOwned(db, id, userId)
  if (!spot) return c.notFound()

  const vegetables = await searchVegetables(db, '', '')

  return c.html(
    <Layout title="野菜を植える">
      <NewPlantingPage
        spotId={spot.id}
        spotName={spot.name}
        vegetables={vegetables}
        defaultDate={todayJstDateKey()}
        error={error}
      />
    </Layout>
  )
})

// HTMX: 植物の絞り込み（カテゴリタブ・名前検索） → select を差し替え
route.get('/:id/plantings/vegetable-options', async (c) => {
  const db = getDb(c.env.DB)
  const q = (c.req.query('q') ?? '').trim()
  const category = c.req.query('category') ?? ''
  const vegetables = await searchVegetables(db, q, category)
  return c.html(<VegetableSelect vegetables={vegetables} />)
})

route.post('/:id/plantings', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const spotId = positiveInt(c.req.param('id'))
  if (spotId === null) return c.notFound()

  const spot = await findSpotOwned(db, spotId, userId)
  if (!spot) return c.notFound()

  const body = await c.req.parseBody()
  const vegetableId = Number(body.vegetable_id)
  const plantedAtStr = String(body.planted_at ?? '')
  const notes = String(body.notes ?? '').trim() || null

  const isValidVegetableId = vegetableId > 0 && Number.isInteger(vegetableId)
  const plantedAtDate = new Date(plantedAtStr)
  const isValidDate = Boolean(plantedAtStr) && !isNaN(plantedAtDate.getTime())

  if (!isValidVegetableId || !isValidDate) {
    return c.redirect(`/spots/${spotId}/plantings/new?error=invalid_input`)
  }

  const firstStage = await db
    .select({ id: stageMaster.id })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, vegetableId))
    .orderBy(asc(stageMaster.orderIndex))
    .limit(1)
    .get()

  const [newPlanting] = await db
    .insert(plantings)
    .values({
      userId,
      spotId,
      vegetableId,
      currentStageId: firstStage?.id ?? null,
      plantedAt: plantedAtDate,
      notes,
    })
    .returning({ id: plantings.id })

  // Not batched with the insert above: schedule rows need newPlanting.id, which only
  // exists after the insert commits. Worst case on failure here is a planting with no
  // schedules yet (recoverable, non-destructive) — unlike checkpoint completion this
  // never deletes existing data, so the atomicity tradeoff isn't worth the complexity.
  if (firstStage && newPlanting) {
    await generateTaskSchedules(db, newPlanting.id, firstStage.id)
  }

  return c.redirect(`/spots/${spotId}`)
})

export default route
