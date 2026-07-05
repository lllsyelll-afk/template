import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "./auth";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

const NATIVE_ORIGINS = ["http://localhost", "capacitor://localhost"];

export function nativeAppKey(isDev: boolean): MiddlewareHandler<AppEnv> {
  const EXPECTED_KEY = process.env.NATIVE_APP_KEY || "";

  if (!isDev && !EXPECTED_KEY) {
    throw new Error(
      "NATIVE_APP_KEY environment variable is required in production",
    );
  }

  return async (c, next) => {
    if (isDev) {
      return next();
    }

    const origin = c.req.header("Origin") || "";
    const isNative = NATIVE_ORIGINS.includes(origin);

    if (!isNative) {
      return next();
    }

    const appKey = c.req.header("X-App-Key");
    if (!appKey || appKey !== EXPECTED_KEY) {
      throw new AppError(ErrorCode.PERMISSION_REQUIRED, 403);
    }

    return next();
  };
}
