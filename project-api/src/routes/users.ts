// User self-management + admin-style block route.
import { Hono } from "hono";
import { z } from "zod";
import type { Repositories } from "../types";
import {
  requireAuth,
  requirePermission,
  type AppEnv,
} from "../middleware/auth";
import { ADMIN_PERMISSIONS } from "../permissions";
import { createEmailAdapter, EmailError } from "../email";
import { otpTemplate } from "../email/templates";
import { createSmsAdapter, SmsError } from "../sms";
import { generateOtp, OTP_TTL_MS, MAX_OTP_ATTEMPTS, isDev } from "../utils/otp";
import { generateTotpSecret, verifyTotpToken } from "../utils/totp";
import { wsServer } from "../websocket";
import { sanitizeSearchQuery } from "../utils/sanitize";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

const updateMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  photo: z.string().url().optional(),
});

const emailChangeRequestSchema = z.object({
  email: z.string().email(),
});

const emailChangeVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const phoneChangeRequestSchema = z.object({
  phone: z.string().min(4).max(40),
});

const phoneChangeVerifySchema = z.object({
  phone: z.string().min(4).max(40),
  code: z.string().length(6),
});

const blockSchema = z.object({
  userId: z.string().min(1),
  blocked: z.boolean(),
});

const totpVerifySchema = z.object({
  code: z.string().length(6),
});

function sanitizeUser<T extends { passwordHash?: string; totpSecret?: string | null }>(u: T) {
  const { passwordHash: _omit, totpSecret: _omit2, ...rest } = u as T & {
    passwordHash?: string;
    totpSecret?: string | null;
  };
  return rest;
}

export function createUsersRoutes(repos: Repositories) {
  const r = new Hono<AppEnv>();
  const emailAdapter = createEmailAdapter();
  const smsAdapter = createSmsAdapter();
  r.use("*", requireAuth(repos));

  r.get("/search", async (c) => {
    const query = sanitizeSearchQuery(c.req.query("q") || "");
    if (query.length < 2) {
      return c.json({ users: [] });
    }
    const users = await repos.users.search(query, 20);
    return c.json({ users: users.map(sanitizeUser) });
  });

  r.get("/me", async (c) => {
    const { user } = c.get("auth");
    return c.json({ user: sanitizeUser(user) });
  });

  r.patch("/me", async (c) => {
    const { user } = c.get("auth");
    const body = await c.req.json().catch(() => null);
    const parsed = updateMeSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const updated = await repos.users.update(user._id, parsed.data);
    
    // Notify user of profile update
    if (updated) {
      wsServer.notifyUserProfileUpdate(user._id, sanitizeUser(updated));
    }
    
    return c.json({ user: updated ? sanitizeUser(updated) : null });
  });

  r.patch("/block", requirePermission(ADMIN_PERMISSIONS.users.block), async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const updated = await repos.users.update(parsed.data.userId, {
      blocked: parsed.data.blocked,
    });
    if (!updated) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    
    // Notify user of blocking status change
    wsServer.notifyUserBlocked(parsed.data.userId, parsed.data.blocked);
    
    return c.json({ user: sanitizeUser(updated) });
  });

  r.post("/me/email-change-request", async (c) => {
    const { user } = c.get("auth");
    const body = await c.req.json().catch(() => null);
    const parsed = emailChangeRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { email } = parsed.data;

    // Check if email is already used by another user
    const existingUser = await repos.users.findByEmail(email);
    if (existingUser && existingUser._id !== user._id) {
      throw new AppError(ErrorCode.EMAIL_ALREADY_USED, 409);
    }

    const code = generateOtp();
    if (isDev()) console.log(`[DEV OTP] email-change for ${email}: ${code}`);
    await repos.otps.create({
      identifier: email,
      code,
      purpose: "email_change",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const { html, subject } = otpTemplate({
        code,
        purpose: "email_change",
        expiresInMinutes: 10,
      });
      await emailAdapter.sendEmail(email, subject, html);
      return c.json({
        message: "code_sent",
        email,
        ...(isDev() ? { otp: { code, identifier: email } } : {}),
      });
    } catch (error) {
      if (error instanceof EmailError) {
        throw new AppError(ErrorCode.EMAIL_FAILED, 500, { message: error.message });
      }
      throw new AppError(ErrorCode.EMAIL_FAILED, 500, { message: "Failed to send email" });
    }
  });

  r.post("/me/email-change-verify", async (c) => {
    const { user } = c.get("auth");
    const body = await c.req.json().catch(() => null);
    const parsed = emailChangeVerifySchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { email, code } = parsed.data;

    const otp = await repos.otps.findActive(email, code, "email_change");
    if (!otp) {
      const failedAttempts = await repos.otps.recordFailedAttempt(email, "email_change");
      if (failedAttempts >= MAX_OTP_ATTEMPTS) {
        await repos.otps.invalidateByIdentifier(email, "email_change");
        throw new AppError(ErrorCode.TOO_MANY_ATTEMPTS, 429, { message: "Too many failed attempts. Please request a new code." });
      }
      throw new AppError(ErrorCode.INVALID_OR_EXPIRED_CODE, 400, { remainingAttempts: MAX_OTP_ATTEMPTS - failedAttempts });
    }
    await repos.otps.markUsed(otp._id);

    // Check again if email is already used by another user
    const existingUser = await repos.users.findByEmail(email);
    if (existingUser && existingUser._id !== user._id) {
      throw new AppError(ErrorCode.EMAIL_ALREADY_USED, 409);
    }

    const updated = await repos.users.update(user._id, { email });
    if (!updated) throw new AppError(ErrorCode.UPDATE_FAILED, 500);

    // Notify user of email update
    wsServer.notifyUserProfileUpdate(user._id, sanitizeUser(updated));

    return c.json({
      message: "email_updated",
      user: sanitizeUser(updated),
    });
  });

  r.post("/me/phone-change-request", async (c) => {
    const { user } = c.get("auth");
    const body = await c.req.json().catch(() => null);
    const parsed = phoneChangeRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { phone } = parsed.data;

    // Check if phone is already used by another user
    const existingUser = await repos.users.findByPhone(phone);
    if (existingUser && existingUser._id !== user._id) {
      throw new AppError(ErrorCode.PHONE_ALREADY_USED, 409);
    }

    const code = generateOtp();
    if (isDev()) console.log(`[DEV OTP] phone-change for ${phone}: ${code}`);
    await repos.otps.create({
      identifier: phone,
      code,
      purpose: "phone_change",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const otpResponse = await smsAdapter.sendOtp(phone, code);
      return c.json({
        message: "code_sent",
        phone,
        otp: otpResponse,
      });
    } catch (error) {
      if (error instanceof SmsError) {
        throw new AppError(ErrorCode.SMS_FAILED, 500, { message: error.message });
      }
      throw new AppError(ErrorCode.SMS_FAILED, 500, { message: "Failed to send SMS" });
    }
  });

  r.post("/me/phone-change-verify", async (c) => {
    const { user } = c.get("auth");
    const body = await c.req.json().catch(() => null);
    const parsed = phoneChangeVerifySchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { phone, code } = parsed.data;

    const otp = await repos.otps.findActive(phone, code, "phone_change");
    if (!otp) {
      const failedAttempts = await repos.otps.recordFailedAttempt(phone, "phone_change");
      if (failedAttempts >= MAX_OTP_ATTEMPTS) {
        await repos.otps.invalidateByIdentifier(phone, "phone_change");
        throw new AppError(ErrorCode.TOO_MANY_ATTEMPTS, 429, { message: "Too many failed attempts. Please request a new code." });
      }
      throw new AppError(ErrorCode.INVALID_OR_EXPIRED_CODE, 400, { remainingAttempts: MAX_OTP_ATTEMPTS - failedAttempts });
    }
    await repos.otps.markUsed(otp._id);

    // Check again if phone is already used by another user
    const existingUser = await repos.users.findByPhone(phone);
    if (existingUser && existingUser._id !== user._id) {
      throw new AppError(ErrorCode.PHONE_ALREADY_USED, 409);
    }

    const updated = await repos.users.update(user._id, { phone });
    if (!updated) throw new AppError(ErrorCode.UPDATE_FAILED, 500);

    // Notify user of phone update
    wsServer.notifyUserProfileUpdate(user._id, sanitizeUser(updated));

    return c.json({
      message: "phone_updated",
      user: sanitizeUser(updated),
    });
  });

  // ── 2FA (TOTP) routes ──

  r.get("/me/2fa/status", async (c) => {
    const { user } = c.get("auth");
    return c.json({
      enabled: !!user.twoFactorEnabled,
      hasSecret: !!user.totpSecret,
    });
  });

  r.post("/me/2fa/setup", async (c) => {
    const { user } = c.get("auth");
    if (user.twoFactorEnabled) {
      throw new AppError(ErrorCode.TOTP_ALREADY_ENABLED, 400);
    }
    const { secret, otpauthUrl } = generateTotpSecret(user.name);
    await repos.users.update(user._id, { totpSecret: secret });
    return c.json({ otpauthUrl, secret });
  });

  r.post("/me/2fa/verify", async (c) => {
    const { user } = c.get("auth");
    if (!user.totpSecret) {
      throw new AppError(ErrorCode.TOTP_NOT_ENABLED, 400);
    }
    if (user.twoFactorEnabled) {
      throw new AppError(ErrorCode.TOTP_ALREADY_ENABLED, 400);
    }
    const body = await c.req.json().catch(() => null);
    const parsed = totpVerifySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    }
    const valid = verifyTotpToken(user.totpSecret, parsed.data.code);
    if (!valid) {
      throw new AppError(ErrorCode.TOTP_INVALID, 400);
    }
    await repos.users.update(user._id, { twoFactorEnabled: true });
    return c.json({ enabled: true });
  });

  r.post("/me/2fa/disable", async (c) => {
    const { user } = c.get("auth");
    if (!user.twoFactorEnabled || !user.totpSecret) {
      throw new AppError(ErrorCode.TOTP_NOT_ENABLED, 400);
    }
    const body = await c.req.json().catch(() => null);
    const parsed = totpVerifySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    }
    const valid = verifyTotpToken(user.totpSecret, parsed.data.code);
    if (!valid) {
      throw new AppError(ErrorCode.TOTP_INVALID, 400);
    }
    await repos.users.update(user._id, {
      twoFactorEnabled: false,
      totpSecret: null,
    });
    return c.json({ enabled: false });
  });

  return r;
}
