import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  return crypto.scryptSync(key, "salt", KEY_LENGTH);
}

/**
 * Encrypt a string value (e.g., id) into a URL-safe token.
 */
export function encryptToken(value: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  // Combine iv + tag + encrypted data, then URL-safe base64 encode
  const buffer = Buffer.concat([iv, tag, Buffer.from(encrypted, "base64")]);
  return buffer.toString("base64url");
}

/**
 * Decrypt a URL-safe token back to the original string value.
 */
export function decryptToken(token: string): string {
  const key = getKey();
  const buffer = Buffer.from(token, "base64url");

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
