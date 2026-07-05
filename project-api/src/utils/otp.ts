// Dev OTP utility. Always returns the generated code to the caller so the
// frontend can show / pre-fill it. In production, replace this by SMS/email
// delivery and remove the code from the API response.
import { randomInt } from "crypto";

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function isDev(): boolean {
  return process.env.ENV !== "production";
}

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_OTP_ATTEMPTS = 5;
