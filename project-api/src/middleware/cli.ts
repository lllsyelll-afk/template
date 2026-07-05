// CLI security middleware for API key validation
import { timingSafeEqual } from "crypto";
import type { MiddlewareHandler } from "hono";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";
import type { AppEnv } from "./auth";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function requireCliApiKey(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const apiKey = c.req.header("x-cli-api-key") || c.req.header("X-Cli-Api-Key");
    const expectedKey = process.env.CLI_API_KEY;
    const isDev = process.env.ENV === "development";

    if (!expectedKey) {
      if (isDev) {
        console.warn("[cli] CLI_API_KEY not configured, allowing unauthenticated CLI access (development only)");
        await next();
        return;
      }
      console.error("[cli] CLI_API_KEY not configured, denying CLI access");
      throw new AppError(ErrorCode.CLI_NOT_CONFIGURED, 503);
    }

    if (!apiKey) {
      throw new AppError(ErrorCode.CLI_MISSING_API_KEY, 401);
    }

    if (!safeCompare(apiKey, expectedKey)) {
      throw new AppError(ErrorCode.CLI_INVALID_API_KEY, 403);
    }

    await next();
  };
}
