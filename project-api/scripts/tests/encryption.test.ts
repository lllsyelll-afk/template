import { describe, it, expect, beforeEach } from "@jest/globals";
import { encryptPassword, decryptPassword, generateEncryptionKey, isEncrypted } from "../utils/encryption";

describe("Encryption Utility", () => {
  const originalEncryptionKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    // Reset encryption key before each test
    delete process.env.ENCRYPTION_KEY;
  });

  afterAll(() => {
    // Restore original encryption key
    if (originalEncryptionKey) {
      process.env.ENCRYPTION_KEY = originalEncryptionKey;
    }
  });

  describe("encryptPassword", () => {
    it("should encrypt a password successfully", () => {
      const password = "testPassword123";
      const encrypted = encryptPassword(password);
      
      expect(encrypted).not.toBe(password);
      expect(encrypted).toContain(":"); // Should have iv:tag:encrypted format
      expect(encrypted.length).toBeGreaterThan(password.length);
    });

    it("should produce different encrypted output for same password", () => {
      const password = "testPassword123";
      const encrypted1 = encryptPassword(password);
      const encrypted2 = encryptPassword(password);
      
      expect(encrypted1).not.toBe(encrypted2); // Due to random IV
    });
  });

  describe("decryptPassword", () => {
    it("should decrypt an encrypted password correctly", () => {
      const originalPassword = "testPassword123";
      const encrypted = encryptPassword(originalPassword);
      const decrypted = decryptPassword(encrypted);
      
      expect(decrypted).toBe(originalPassword);
    });

    it("should throw error for invalid encrypted data", () => {
      const invalidData = "invalid:format";
      
      expect(() => decryptPassword(invalidData)).toThrow("Invalid encrypted data format");
    });

    it("should throw error for malformed encrypted data", () => {
      const malformedData = "iv:tag";
      
      expect(() => decryptPassword(malformedData)).toThrow("Invalid encrypted data format");
    });
  });

  describe("isEncrypted", () => {
    it("should return true for encrypted data", () => {
      const password = "testPassword123";
      const encrypted = encryptPassword(password);
      
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for plain text", () => {
      const plainText = "testPassword123";
      
      expect(isEncrypted(plainText)).toBe(false);
    });

    it("should return false for invalid format", () => {
      const invalidFormat = "invalid:format";
      
      expect(isEncrypted(invalidFormat)).toBe(false);
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a 64-character hex string", () => {
      const key = generateEncryptionKey();
      
      expect(key).toMatch(/^[a-f0-9]{64}$/i);
      expect(key.length).toBe(64);
    });

    it("should generate different keys each time", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe("round-trip encryption", () => {
    it("should handle various password types", () => {
      const passwords = [
        "simple",
        "complex123!@#",
        "veryLongPasswordWithManyCharacters123456789",
        "unicode🔒password",
        "",
      ];

      passwords.forEach(password => {
        if (password) { // Skip empty string as it's not a valid password
          const encrypted = encryptPassword(password);
          const decrypted = decryptPassword(encrypted);
          expect(decrypted).toBe(password);
        }
      });
    });
  });
});
