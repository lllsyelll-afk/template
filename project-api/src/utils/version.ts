import type { Context } from "hono";
import type { AppEnv } from "../middleware/auth";

export function isVersion(
  c: Context<AppEnv>,
  version: number 
): boolean {
  const current = Number(c.get("apiVersion"));
  return current === version;
}
