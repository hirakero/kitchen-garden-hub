import { app } from './app'
import type { Bindings } from './app'
import { dailyNotify } from './cron/daily-notify'

export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await dailyNotify(env)
  },
}
