// CLI routes entry point. Mounts CLI sub-routes for admin management.
import { Hono } from "hono";
import type { Repositories } from "../../types";
import { type AppEnv } from "../../middleware/auth";
import { requireCliApiKey } from "../../middleware/cli";
export function createCliRoutes(_repos: Repositories) {
  const r = new Hono<AppEnv>();

  // Redirect trailing slashes to non-trailing versions (safety net)
  r.use(async (c, next) => {
    const path = c.req.path;
    if (path.length > 1 && path.endsWith("/")) {
      const url = new URL(c.req.url);
      url.pathname = url.pathname.slice(0, -1);
      return c.redirect(url.toString());
    }
    await next();
  });

  r.use("*", requireCliApiKey());

  // Queue diagnostics and management
  r.get("/queue/stats", async (c) => {
    const { getQueue } = await import("../../queue");
    const stats = await getQueue().getStats();
    return c.json(stats);
  });

  r.get("/queue/jobs", async (c) => {
    const { getQueue } = await import("../../queue");
    const status = c.req.query("status") as any;
    const limit = Number(c.req.query("limit") || 50);
    const jobs = await getQueue().getJobs(status, limit);
    return c.json({ jobs });
  });

  r.post("/queue/retry-failed", async (c) => {
    const { getQueue } = await import("../../queue");
    const count = await getQueue().retryFailed();
    return c.json({ retried: count });
  });

  r.post("/queue/clear-completed", async (c) => {
    const { getQueue } = await import("../../queue");
    const count = await getQueue().clearCompleted();
    return c.json({ cleared: count });
  });

  return r;
}
