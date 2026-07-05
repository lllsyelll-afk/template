import jwt, { type SignOptions } from "jsonwebtoken";

const SECRET: string = process.env.JWT_SECRET ?? "";
if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "30d") as SignOptions["expiresIn"];

export interface JwtPayload {
  sub: string; // userId
  tv: number; // tokenVersion
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload;
    if (!decoded || typeof decoded.sub !== "string" || typeof decoded.tv !== "number") return null;
    return decoded;
  } catch {
    return null;
  }
}

export interface TotpChallengePayload {
  sub: string;
  purpose: "totp_challenge";
}

export function signTotpChallenge(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "totp_challenge" }, SECRET, {
    expiresIn: "5m",
  });
}

export function verifyTotpChallenge(token: string): TotpChallengePayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as TotpChallengePayload;
    if (!decoded || typeof decoded.sub !== "string" || decoded.purpose !== "totp_challenge") return null;
    return decoded;
  } catch {
    return null;
  }
}
