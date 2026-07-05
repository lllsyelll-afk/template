// API-version middleware. Reads X-Api-Version header, defaults to "1",
// and rejects unsupported versions with 400.
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./auth";

export function apiVersion(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const raw = c.req.header("X-Api-Version");
    const version = raw?.trim() || "1";
    c.set("apiVersion", version);
    await next();
  };
}
