// routes and wires up the repository layer (MongoDB-by-default with an
// in-memory fallback for local dev).
// Force-reload nodemon to read new .env values
import "dotenv/config";

console.log("Welcome to api!");

import { Hono } from "hono";
import { createCorsMiddleware } from "./middleware/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { rateLimiter } from "hono-rate-limiter";
import { initRepositories } from "./db";
import { createAuthRoutes } from "./routes/auth";
import { createUsersRoutes } from "./routes/users";
import { createFilesRoutes } from "./routes/files";
import { createAdminRoutes } from "./routes/admin";
import { createCliRoutes } from "./routes/cli";
import { createNotificationsRoutes } from "./routes/notifications";
import { createPushSubscriptionsRoutes } from "./routes/push-subscriptions";
import { AppError } from "./utils/AppError";
import { ErrorCode } from "./utils/errorCodes";
import type { AppEnv } from "./middleware/auth";
import { apiVersion } from "./middleware/version";
import { nativeAppKey } from "./middleware/nativeAppKey";
import { wsServer } from "./websocket";
import { createSmsAdapter } from "./sms";
import { createEmailAdapter } from "./email";
import { getDefaultStorage } from "./storage";

const PORT = Number(process.env.API_PORT || 45231);
const isDev = process.env.ENV === "development";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
); // 15 minutes
const RATE_LIMIT_GENERAL = Number(process.env.RATE_LIMIT_GENERAL || 100);
const RATE_LIMIT_AUTH = Number(process.env.RATE_LIMIT_AUTH || 5);
const RATE_LIMIT_SMS = Number(process.env.RATE_LIMIT_SMS || 3);
const RATE_LIMIT_UPLOAD = Number(process.env.RATE_LIMIT_UPLOAD || 20);

// Comma-separated trusted proxy IPs (e.g., "127.0.0.1,10.0.0.2")
const TRUSTED_PROXIES = (process.env.TRUSTED_PROXIES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isPrivateIP(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

type KeyGenerator = Parameters<Parameters<typeof rateLimiter>[0]["keyGenerator"]>[0];

function getConnectionIP(c: KeyGenerator): string | null {
  const incoming = (
    c as unknown as { env?: { incoming?: import("http").IncomingMessage } }
  ).env?.incoming;
  const addr = incoming?.socket?.remoteAddress;
  if (!addr) return null;
  return addr.startsWith("::ffff:") ? addr.slice(7) : addr;
}

// Helper to get client IP for rate limiting
function getClientIP(c: KeyGenerator): string {
  const connIP = getConnectionIP(c);
  if (!connIP) return "unknown-ip";

  const isTrustedProxy =
    TRUSTED_PROXIES.includes(connIP) || (isDev && isPrivateIP(connIP));

  if (isTrustedProxy) {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
      const clientIP = forwarded.split(",")[0].trim();
      if (clientIP) return clientIP;
    }
    const realIP = c.req.header("x-real-ip");
    if (realIP) return realIP;
  }

  return connIP;
}
async function displayConfiguration() {
  console.log("\n" + "=".repeat(40));
  console.log("🚀 IHAJAZ API PROVIDERS");
  console.log("=".repeat(40));

  // Database Configuration
  const dbStatus = process.env.MONGODB_URI ? "MongoDB" : "In-Memory";
  console.log(`� Database: ${dbStatus}`);

  // SMS Configuration with connection check
  const smsAdapter = createSmsAdapter();
  const smsStatus = await smsAdapter.check();
  const smsProvider = process.env.SMS_PROVIDER || "local";
  console.log(`� SMS: ${smsProvider} ${smsStatus ? "✅" : "❌"}`);

  // Storage Configuration with connection check
  const storageAdapter = getDefaultStorage();
  const storageStatus = await storageAdapter.check();
  const storageProvider = process.env.STORAGE_PROVIDER || "local";
  console.log(`� Storage: ${storageProvider} ${storageStatus ? "✅" : "❌"}`);

  // Email Configuration with connection check
  const emailAdapter = createEmailAdapter();
  const emailStatus = await emailAdapter.check();
  const emailProvider = process.env.EMAIL_PROVIDER || "local";
  console.log(`📧 Email: ${emailProvider} ${emailStatus ? "✅" : "❌"}`);

  // Other services (no connection check available)
  console.log(`💳 Payment: Chargily`);

  console.log("=".repeat(40));
  console.log("✅ Ready\n");
}

async function main() {
  await displayConfiguration();
  const { repos } = await initRepositories();
  const app = new Hono<AppEnv>();

  const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "";
  if (!isDev && !ALLOWED_ORIGIN) {
    throw new Error(
      "CORS_ORIGIN environment variable is required in production",
    );
  }

  app.use(
    "*",
    secureHeaders({
      strictTransportSecurity: isDev ? false : undefined,
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com", "https://challenges.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http://localhost:*", "http://127.0.0.1:*"],
        connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "ws:", "wss:", "https:"],
        frameSrc: ["'self'", "https://accounts.google.com", "https://challenges.cloudflare.com"],
        manifestSrc: ["'self'"],
      },
    }),
  );

  app.use("*", createCorsMiddleware(isDev, ALLOWED_ORIGIN));

  // Request/response logging
  app.use("*", logger());

  // General rate limiter: 100 requests per 15 minutes per IP
  if (!isDev) {
    app.use(
      "*",
      rateLimiter({
        windowMs: RATE_LIMIT_WINDOW_MS,
        limit: RATE_LIMIT_GENERAL,
        standardHeaders: "draft-6",
        keyGenerator: (c) => getClientIP(c),
      }),
    );
  }

  app.use("*", apiVersion());
  app.use("*", nativeAppKey(isDev));

  // Root-level health check — minimal public response
  app.get("/health", async (c) => {
    return c.json({
      ok: true,
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // Create API sub-app for all data routes
  const apiApp = new Hono<AppEnv>();

  apiApp.get("/", (c) => c.json({ name: "api", ok: true }));
  apiApp.get("/health", (c) => c.json({ ok: true }));

  // Apply rate limiting in production to prevent abuse
  if (!isDev) {
    // Strict auth endpoints (brute force protection)
    const strictAuthLimiter = rateLimiter({
      windowMs: RATE_LIMIT_WINDOW_MS,
      limit: RATE_LIMIT_AUTH,
      standardHeaders: "draft-6",
      keyGenerator: (c) => `auth:${getClientIP(c)}`,
    });

    // SMS endpoints (prevent SMS abuse and OTP flooding)
    const smsLimiter = rateLimiter({
      windowMs: RATE_LIMIT_WINDOW_MS,
      limit: RATE_LIMIT_SMS,
      standardHeaders: "draft-6",
      keyGenerator: (c) => `sms:${getClientIP(c)}`,
    });

    // Upload endpoints (prevent storage abuse and DoS)
    const uploadLimiter = rateLimiter({
      windowMs: RATE_LIMIT_WINDOW_MS,
      limit: RATE_LIMIT_UPLOAD,
      standardHeaders: "draft-6",
      keyGenerator: (c) => `upload:${getClientIP(c)}`,
    });

    // General API rate limiter (catch-all protection)
    const generalLimiter = rateLimiter({
      windowMs: RATE_LIMIT_WINDOW_MS,
      limit: RATE_LIMIT_GENERAL,
      standardHeaders: "draft-6",
      keyGenerator: (c) => `general:${getClientIP(c)}`,
    });

    // Apply strict rate limiting to auth endpoints
    apiApp.use("/auth/login", strictAuthLimiter);
    apiApp.use("/auth/login/verify-totp", strictAuthLimiter);
    apiApp.use("/auth/register", strictAuthLimiter);
    apiApp.use("/auth/verify-otp", strictAuthLimiter);
    apiApp.use("/auth/google-login", strictAuthLimiter);
    apiApp.use("/auth/google-register-info", strictAuthLimiter);
    apiApp.use("/auth/reset-password", strictAuthLimiter);

    // Apply SMS rate limiting to OTP endpoints
    apiApp.use("/auth/forgot-password-request", smsLimiter);
    apiApp.use("/auth/resend-otp", smsLimiter);

    // Apply upload rate limiting
    apiApp.use("/files/upload", uploadLimiter);

    // Apply general rate limiting to all API routes
    apiApp.use("*", generalLimiter);
  }

  apiApp.route("/auth", createAuthRoutes(repos));
  apiApp.route("/users", createUsersRoutes(repos));
  apiApp.route("/files", createFilesRoutes(repos));
  apiApp.route("/admin", createAdminRoutes(repos));
  apiApp.route("/cli", createCliRoutes(repos));
  apiApp.route("/notifications", createNotificationsRoutes(repos));
  apiApp.route("/push-subscriptions", createPushSubscriptionsRoutes(repos));

  // Mount API sub-app at /api
  app.route("/api", apiApp);
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: err.code, ...err.data }, err.status as 400 | 401 | 403 | 404 | 409 | 410 | 423 | 429 | 500);
    }
    console.error("[api] unhandled:", err);
    return c.json({ error: ErrorCode.INTERNAL_ERROR }, 500);
  });
  const server = serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" });
  // Initialize WebSocket server
  wsServer.initialize(server);
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[ws] WebSocket server ready at ws://localhost:${PORT}/api/ws`);

  // Graceful shutdown for nodemon restarts
  const shutdown = () => {
    console.log("[api] shutting down...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
main().catch((err) => {
  console.error("[api] fatal:", err);
  process.exit(1);
});
