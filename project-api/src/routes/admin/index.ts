// Admin routes entry point. Mounts all admin sub-routes.
import { Hono } from "hono";
import type { Repositories } from "../../types";
import {
  requireAuth,
  require2fa,
  type AppEnv,
} from "../../middleware/auth";
import { auditLog } from "../../middleware/auditLog";

export function createAdminRoutes(repos: Repositories) {
  const r = new Hono<AppEnv>();
  r.use("*", requireAuth(repos));
  r.use("*", require2fa());
  r.use("*", auditLog(repos));

  return r;
}
