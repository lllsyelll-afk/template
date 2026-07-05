// JWT auth middleware for Hono. Attaches the authenticated user to the request context for downstream handlers.
import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";
import type { Repositories, User } from "../types";

export interface AuthCtx {
  user: User;
}

export type AppEnv = {
  Variables: {
    auth: AuthCtx;
    apiVersion: string;
  };
};

function extractToken(c: Context): string | undefined {
  const header = c.req.header("authorization") || c.req.header("Authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return getCookie(c, "auth_token");
}

export function requireAuth(repos: Repositories): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = extractToken(c);
    if (!token) throw new AppError(ErrorCode.MISSING_TOKEN, 401);
    const payload = verifyToken(token);
    if (!payload) throw new AppError(ErrorCode.INVALID_TOKEN, 401);

    const user = await repos.users.findById(payload.sub);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 401);
    if (user.blocked) throw new AppError(ErrorCode.USER_BLOCKED, 403);

    // Reject revoked tokens (e.g., after logout or password reset)
    const currentVersion = user.tokenVersion || 0;
    if (payload.tv !== currentVersion) {
      throw new AppError(ErrorCode.INVALID_TOKEN, 401);
    }

    c.set("auth", { user });
    await next();
  };
}

export function requirePermission(
  requiredPermission: string,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const auth = c.get("auth");
    if (
      !auth?.user.permissions ||
      !auth.user.permissions.includes(requiredPermission)
    ) {
      throw new AppError(ErrorCode.PERMISSION_REQUIRED, 403);
    }
    await next();
  };
}

export function requireVerified(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const auth = c.get("auth");
    if (!auth?.user.verified) {
      throw new AppError(ErrorCode.PHONE_VERIFICATION_REQUIRED, 403);
    }
    await next();
  };
}

export function require2fa(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const auth = c.get("auth");
    if (!auth?.user.twoFactorEnabled) {
      throw new AppError(ErrorCode.TOTP_2FA_REQUIRED, 403);
    }
    await next();
  };
}

export function getAuth(c: Context<AppEnv>): AuthCtx {
  return c.get("auth");
}
