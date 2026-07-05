import { timingSafeEqual } from "crypto";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./auth";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const ALLOWED_HEADERS = ["Content-Type", "Authorization", "X-Api-Version"];
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

export function createCorsMiddleware(isDev: boolean, allowedOrigin: string): MiddlewareHandler<AppEnv> {
  const allowed = allowedOrigin
    ? allowedOrigin.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return async (c, next) => {
    const origin = c.req.header("Origin") || "";

    let resolvedOrigin = "";

    if (isDev) {
      resolvedOrigin = origin || "*";
    } else {
      const cliKey = c.req.header("x-cli-api-key") || c.req.header("X-Cli-Api-Key");
      const expectedCliKey = process.env.CLI_API_KEY;

      if (cliKey && expectedCliKey && safeCompare(cliKey, expectedCliKey)) {
        resolvedOrigin = origin;
      } else if (origin && allowed.includes(origin)) {
        resolvedOrigin = origin;
      }
    }

    if (resolvedOrigin) {
      c.header("Access-Control-Allow-Origin", resolvedOrigin);
      c.header("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
      c.header("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
      c.header("Access-Control-Allow-Credentials", "true");
      c.header("Vary", "Origin");
    }

    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }

    await next();
  };
}
