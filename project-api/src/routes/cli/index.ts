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

  return r;
}
