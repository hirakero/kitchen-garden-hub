import { app } from './app'
import type { Bindings } from './app'

export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const { dailyNotify } = await import('./cron/daily-notify')
    await dailyNotify(env)
  },
}
