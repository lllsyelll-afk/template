import { generateSecret, verifySync } from "otplib";

export function generateTotpSecret(userName: string): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = generateSecret();
  const serviceName = process.env.APP_NAME
  const label = encodeURIComponent(`${serviceName}:${userName}`);
  const issuer = encodeURIComponent(serviceName);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
  return { secret, otpauthUrl };
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return result.valid === true;
  } catch {
    return false;
  }
}
