// Auth routes: register, OTP verification, login, current user.
import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import type { Repositories } from "../types";
import { signToken, signTotpChallenge, verifyTotpChallenge } from "../utils/jwt";
import { generateOtp, OTP_TTL_MS, MAX_OTP_ATTEMPTS } from "../utils/otp";
import { verifyTotpToken } from "../utils/totp";
import { validatePassword } from "../utils/password";
import { requireAuth, type AppEnv } from "../middleware/auth";
import { createSmsAdapter, SmsError } from "../sms";
import { createEmailAdapter } from "../email";
import { lockAccountTemplate } from "../email/templates";
import { AppError } from "../utils/AppError";
import { ErrorCode, type ErrorCodeValue } from "../utils/errorCodes";

const isDev = process.env.ENV === "development";

function setAuthCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, "auth_token", token, {
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? "Lax" : "Strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

const registerSchema = z
  .object({
    name: z.string().min(1).max(120),
    phone: z.string().min(4).max(40),
    email: z.string().email().optional(),
    password: z.string().min(8).max(128),
    photo: z.string().url().optional(),
    googleId: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      // Custom password validation
      const result = validatePassword(data.password);
      return result.valid;
    },
    {
      message: "Password must contain only letters and numbers",
      path: ["password"],
    },
  );

const verifyOtpSchema = z.object({
  identifier: z.string().min(3), // phone or email
  code: z.string().length(6),
  purpose: z.enum(["register", "login", "forgot_password"]).default("register"),
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

const forgotPasswordRequestSchema = z.object({
  phone: z.string().min(4).max(40),
});

const resetPasswordSchema = z
  .object({
    identifier: z.string().min(3),
    code: z.string().length(6),
    newPassword: z.string().min(8).max(128),
  })
  .refine(
    (data) => {
      const result = validatePassword(data.newPassword);
      return result.valid;
    },
    {
      message: "Password must contain only letters and numbers",
      path: ["newPassword"],
    },
  );

const googleLoginSchema = z.object({
  credential: z.string().min(1),
});


function sanitizeUser<T extends { passwordHash?: string; totpSecret?: string | null }>(u: T) {
  const { passwordHash: _omit, totpSecret: _omit2, ...rest } = u as T & {
    passwordHash?: string;
    totpSecret?: string | null;
  };
  return rest;
}

type GoogleVerifyError = {
  error: "invalid_google_token" | "invalid_google_client" | "email_not_verified";
  status: 401;
};

import { OAuth2Client } from "google-auth-library";

const googleOAuthClient = new OAuth2Client();

async function verifyGoogleCredential(
  credential: string,
): Promise<
  | GoogleVerifyError
  | {
      googleId: string;
      email: string;
      name?: string;
      picture?: string;
    }
> {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error("Google Client ID not configured");
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return { error: "invalid_google_token", status: 401 };
    }

    if (payload.email_verified !== true) {
      return { error: "email_not_verified", status: 401 };
    }

    return {
      googleId: payload.sub,
      email: payload.email ?? "",
      name: payload.name ?? undefined,
      picture: payload.picture ?? undefined,
    };
  } catch {
    return { error: "invalid_google_token", status: 401 };
  }
}

export function createAuthRoutes(repos: Repositories) {
  const r = new Hono<AppEnv>();
  const smsAdapter = createSmsAdapter();

  r.post("/register", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { name, phone, email, password, photo, googleId } = parsed.data;

    const existsByPhone = await repos.users.findByPhone(phone);
    if (existsByPhone) throw new AppError(ErrorCode.PHONE_ALREADY_USED, 409);
    if (email) {
      const existsByEmail = await repos.users.findByEmail(email);
      if (existsByEmail) throw new AppError(ErrorCode.EMAIL_ALREADY_USED, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userData: Omit<
      Parameters<typeof repos.users.create>[0],
      "_id" | "createdAt" | "updatedAt"
    > & { email?: string; googleId?: string } = {
      name,
      phone,
      photo: photo ?? null,
      passwordHash,
      blocked: false,
      permissions: [],
      verified: false,
    };
    if (email) {
      userData.email = email;
    }
    if (googleId) {
      userData.googleId = googleId;
    }
    const user = await repos.users.create(userData);

    const code = generateOtp();
    if (isDev) console.log(`[DEV OTP] register for ${phone}: ${code}`);
    await repos.otps.create({
      identifier: phone,
      code,
      purpose: "register",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const otpResponse = await smsAdapter.sendOtp(phone, code);
      return c.json({
        user: sanitizeUser(user),
        otp: otpResponse,
      });
    } catch (error) {
      if (error instanceof SmsError) {
        throw new AppError(ErrorCode.SMS_FAILED, 500, { message: error.message });
      }
      throw new AppError(ErrorCode.SMS_FAILED, 500, {
        message: "Failed to send SMS",
      });
    }
  });

  r.post("/verify-otp", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { identifier, code, purpose } = parsed.data;

    // Brute-force protection: check if too many failed attempts already
    const otp = await repos.otps.findActive(identifier, code, purpose);
    if (!otp) {
      const failedAttempts = await repos.otps.recordFailedAttempt(identifier, purpose);
      if (failedAttempts >= MAX_OTP_ATTEMPTS) {
        await repos.otps.invalidateByIdentifier(identifier, purpose);
        throw new AppError(ErrorCode.TOO_MANY_ATTEMPTS, 429, {
          message: "Too many failed attempts. Please request a new code.",
        });
      }
      throw new AppError(ErrorCode.INVALID_OR_EXPIRED_OTP, 400, {
        remainingAttempts: MAX_OTP_ATTEMPTS - failedAttempts,
      });
    }
    await repos.otps.markUsed(otp._id);

    const user =
      (await repos.users.findByPhone(identifier)) ||
      (await repos.users.findByEmail(identifier));
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    if (user.blocked) throw new AppError(ErrorCode.USER_BLOCKED, 403);

    // Mark user as verified on first OTP verification (registration)
    if (purpose === "register" && !user.verified) {
      await repos.users.update(user._id, { verified: true });
      user.verified = true;
    }

    const token = signToken({ sub: user._id, tv: user.tokenVersion || 0 });
    setAuthCookie(c, token);
    return c.json({ user: sanitizeUser(user) });
  });

  r.post("/login", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { identifier, password } = parsed.data;

    const user =
      (await repos.users.findByPhone(identifier)) ||
      (await repos.users.findByEmail(identifier));
    if (!user) throw new AppError(ErrorCode.INVALID_CREDENTIALS, 401);
    if (user.blocked) throw new AppError(ErrorCode.USER_BLOCKED, 403);

    // Check if account is locked
    const lockoutStatus = await repos.users.getLockoutStatus(user._id);
    if (lockoutStatus.locked && lockoutStatus.lockedUntil) {
      const remainingMs = lockoutStatus.lockedUntil.getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      throw new AppError(ErrorCode.ACCOUNT_LOCKED, 423, {
        message: `Account is locked. Please try again in ${remainingMins} minutes.`,
        lockedUntil: lockoutStatus.lockedUntil.toISOString(),
        retryAfterMinutes: remainingMins,
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Record failed login attempt
      const lockoutResult = await repos.users.recordFailedLogin(user._id);

      // Send email notification if account just got locked
      if (lockoutResult.locked && user.email && lockoutResult.lockedUntil) {
        const emailAdapter = createEmailAdapter();
        const lockoutDurationMins = 30;
        const unlockTime = new Date(lockoutResult.lockedUntil);
        const hours = unlockTime.getHours().toString().padStart(2, "0");
        const mins = unlockTime.getMinutes().toString().padStart(2, "0");

        try {
          const { html } = lockAccountTemplate({
            name: user.name,
            hours,
            mins,
            lockoutDurationMins,
          });
          await emailAdapter.sendEmail(user.email, "Account Security Alert - Temporary Lock", html);
        } catch (emailError) {
          console.error("[auth] Failed to send lockout email:", emailError);
          // Don't fail the login request if email fails
        }
      }

      // Return remaining attempts if not locked yet
      if (!lockoutResult.locked) {
        const remainingAttempts = 5 - (lockoutStatus.failedAttempts + 1);
        throw new AppError(ErrorCode.INVALID_CREDENTIALS, 401, {
          message: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before account lockout.`,
          remainingAttempts,
        });
      }

      // Account is now locked
      const remainingMins = 30;
      throw new AppError(ErrorCode.ACCOUNT_LOCKED, 423, {
        message: `Account is now locked due to too many failed attempts. Please try again in ${remainingMins} minutes.`,
        lockedUntil: lockoutResult.lockedUntil?.toISOString(),
        retryAfterMinutes: remainingMins,
      });
    }

    // Successful login - reset failed attempts
    await repos.users.resetFailedLogins(user._id);

    // If 2FA is enabled, return a TOTP challenge instead of a token
    if (user.twoFactorEnabled && user.totpSecret) {
      const challengeToken = signTotpChallenge(user._id);
      return c.json({ requiresTotp: true, challengeToken });
    }

    const token = signToken({ sub: user._id, tv: user.tokenVersion || 0 });
    setAuthCookie(c, token);
    return c.json({ user: sanitizeUser(user) });
  });

  r.post("/login/verify-totp", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = z.object({
      challengeToken: z.string().min(1),
      code: z.string().length(6),
    }).safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { challengeToken, code } = parsed.data;

    const challenge = verifyTotpChallenge(challengeToken);
    if (!challenge) throw new AppError(ErrorCode.INVALID_TOKEN, 401);

    const user = await repos.users.findById(challenge.sub);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    if (user.blocked) throw new AppError(ErrorCode.USER_BLOCKED, 403);
    if (!user.twoFactorEnabled || !user.totpSecret) {
      throw new AppError(ErrorCode.TOTP_NOT_ENABLED, 400);
    }

    const valid = verifyTotpToken(user.totpSecret, code);
    if (!valid) throw new AppError(ErrorCode.TOTP_INVALID, 400);

    const token = signToken({ sub: user._id, tv: user.tokenVersion || 0 });
    setAuthCookie(c, token);
    return c.json({ user: sanitizeUser(user) });
  });

  r.post("/google-login", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = googleLoginSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { credential } = parsed.data;

    // Verify Google ID token
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("Google Client ID not configured. Set GOOGLE_CLIENT_ID environment variable");
      throw new AppError(ErrorCode.GOOGLE_AUTH_NOT_CONFIGURED, 500);
    }

    try {
      const googleInfo = await verifyGoogleCredential(credential);
      if ("error" in googleInfo) {
        throw new AppError(googleInfo.error as ErrorCodeValue, googleInfo.status);
      }

      const { googleId, email } = googleInfo;

      // Find user by googleId
      let user = await repos.users.findByGoogleId(googleId);

      // If not found by googleId, try to find by email and auto-link
      if (!user && email) {
        const existingUser = await repos.users.findByEmail(email);
        if (existingUser) {
          user = await repos.users.update(existingUser._id, { googleId });
        }
      }

      if (!user) {
        throw new AppError(ErrorCode.GOOGLE_ACCOUNT_NOT_FOUND, 403);
      }

      if (user.blocked) throw new AppError(ErrorCode.USER_BLOCKED, 403);

      // If 2FA is enabled, return a TOTP challenge instead of a token
      if (user.twoFactorEnabled && user.totpSecret) {
        const challengeToken = signTotpChallenge(user._id);
        return c.json({ requiresTotp: true, challengeToken });
      }

      const token = signToken({ sub: user._id, tv: user.tokenVersion || 0 });
      setAuthCookie(c, token);
      return c.json({ user: sanitizeUser(user) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Google login error:", error);
      throw new AppError(ErrorCode.GOOGLE_AUTH_FAILED, 500);
    }
  });

  r.post("/google-register-info", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = googleLoginSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { credential } = parsed.data;

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("Google Client ID not configured. Set GOOGLE_CLIENT_ID environment variable");
      throw new AppError(ErrorCode.GOOGLE_AUTH_NOT_CONFIGURED, 500);
    }

    try {
      const googleInfo = await verifyGoogleCredential(credential);
      if ("error" in googleInfo) {
        throw new AppError(googleInfo.error as ErrorCodeValue, googleInfo.status);
      }

      const { googleId, email, name, picture } = googleInfo;

      const existingByEmail = await repos.users.findByEmail(email);
      if (existingByEmail) {
        throw new AppError(ErrorCode.EMAIL_ALREADY_USED, 409);
      }

      return c.json({ googleId, email, name, picture });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Google register info error:", error);
      throw new AppError(ErrorCode.GOOGLE_AUTH_FAILED, 500);
    }
  });

  r.get("/me", requireAuth(repos), async (c) => {
    const { user } = c.get("auth");
    return c.json({ user: sanitizeUser(user) });
  });

  r.post("/resend-otp", requireAuth(repos), async (c) => {
    const { user } = c.get("auth");
    if (user.verified) {
      throw new AppError(ErrorCode.ALREADY_VERIFIED, 400);
    }
    const code = generateOtp();
    if (isDev) console.log(`[DEV OTP] resend for ${user.phone}: ${code}`);
    await repos.otps.create({
      identifier: user.phone,
      code,
      purpose: "register",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const otpResponse = await smsAdapter.sendOtp(user.phone, code);
      return c.json({
        otp: otpResponse,
      });
    } catch (error) {
      if (error instanceof SmsError) {
        throw new AppError(ErrorCode.SMS_FAILED, 500, { message: error.message });
      }
      throw new AppError(ErrorCode.SMS_FAILED, 500, {
        message: "Failed to send SMS",
      });
    }
  });

  r.post("/forgot-password-request", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = forgotPasswordRequestSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { phone } = parsed.data;

    const user = await repos.users.findByPhone(phone);
    if (!user) {
      throw new AppError(ErrorCode.REQUEST_FAILED, 400);
    }

    const code = generateOtp();
    if (isDev) console.log(`[DEV OTP] forgot-password for ${phone}: ${code}`);
    await repos.otps.create({
      identifier: phone,
      code,
      purpose: "forgot_password",
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const otpResponse = await smsAdapter.sendOtp(phone, code);
      return c.json({
        message: "code_sent",
        otp: otpResponse,
      });
    } catch (error) {
      if (error instanceof SmsError) {
        throw new AppError(ErrorCode.SMS_FAILED, 500, { message: error.message });
      }
      throw new AppError(ErrorCode.SMS_FAILED, 500, {
        message: "Failed to send SMS",
      });
    }
  });

  r.post("/reset-password", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    const { identifier, code, newPassword } = parsed.data;

    // Brute-force protection
    const otp = await repos.otps.findActive(identifier, code, "forgot_password");
    if (!otp) {
      const failedAttempts = await repos.otps.recordFailedAttempt(identifier, "forgot_password");
      if (failedAttempts >= MAX_OTP_ATTEMPTS) {
        await repos.otps.invalidateByIdentifier(identifier, "forgot_password");
        throw new AppError(ErrorCode.TOO_MANY_ATTEMPTS, 429, {
          message: "Too many failed attempts. Please request a new code.",
        });
      }
      throw new AppError(ErrorCode.INVALID_OR_EXPIRED_OTP, 400, {
        remainingAttempts: MAX_OTP_ATTEMPTS - failedAttempts,
      });
    }
    await repos.otps.markUsed(otp._id);

    const user = await repos.users.findByPhone(identifier);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    if (user.blocked) throw new AppError(ErrorCode.USER_BLOCKED, 403);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await repos.users.update(user._id, { passwordHash });
    // Invalidate all existing sessions after password change
    await repos.users.incrementTokenVersion(user._id);
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    const token = signToken({ sub: user._id, tv: user.tokenVersion || 0 });
    setAuthCookie(c, token);
    return c.json({ user: sanitizeUser(user) });
  });

  r.post("/logout", requireAuth(repos), async (c) => {
    const { user } = c.get("auth");
    // Revoke all existing tokens for this user
    await repos.users.incrementTokenVersion(user._id);
    deleteCookie(c, "auth_token", { path: "/" });
    return c.json({ ok: true });
  });

  // Log out from all other devices/sessions except the current one
  r.post("/logout-others", requireAuth(repos), async (c) => {
    const { user } = c.get("auth");
    const updatedUser = await repos.users.incrementTokenVersion(user._id);
    if (!updatedUser) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    }
    // Issue a fresh token so the current session remains valid
    const token = signToken({ sub: updatedUser._id, tv: updatedUser.tokenVersion || 0 });
    setAuthCookie(c, token);
    return c.json({ ok: true, user: sanitizeUser(updatedUser) });
  });

  return r;
}
