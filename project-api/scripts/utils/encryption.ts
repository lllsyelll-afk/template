import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Generate encryption key from environment or create one
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("⚠️  ENCRYPTION_KEY not set, generating temporary key");
    return crypto.randomBytes(KEY_LENGTH);
  }
  return crypto.scryptSync(key, "salt", KEY_LENGTH);
};

// Encrypt password
export const encryptPassword = (password: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from("password", "utf8"));

  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Combine iv + tag + encrypted data
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
};

// Decrypt password
export const decryptPassword = (encryptedData: string): string => {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from("password", "utf8"));
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Generate a secure encryption key for environment setup
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
};

// Check if data is encrypted (simple heuristic)
export const isEncrypted = (data: string): boolean => {
  const parts = data.split(":");
  return (
    parts.length === 3 &&
    parts[0].length === IV_LENGTH * 2 &&
    parts[1].length === TAG_LENGTH * 2
  );
};
