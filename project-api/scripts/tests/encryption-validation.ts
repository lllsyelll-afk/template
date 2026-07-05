// Simple validation script for encryption functionality
import { encryptPassword, decryptPassword, generateEncryptionKey, isEncrypted } from "../utils/encryption";

function runTests(): void {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean): void {
    try {
      const result = fn();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error}`);
      failed++;
    }
  }

  console.log("🔐 Running Encryption Tests\n");

  test("encryptPassword should encrypt a password", () => {
    const password = "testPassword123";
    const encrypted = encryptPassword(password);
    return encrypted !== password && encrypted.includes(":");
  });

  test("decryptPassword should decrypt correctly", () => {
    const originalPassword = "testPassword123";
    const encrypted = encryptPassword(originalPassword);
    const decrypted = decryptPassword(encrypted);
    return decrypted === originalPassword;
  });

  test("isEncrypted should detect encrypted data", () => {
    const password = "testPassword123";
    const encrypted = encryptPassword(password);
    return isEncrypted(encrypted) && !isEncrypted(password);
  });

  test("generateEncryptionKey should generate valid key", () => {
    const key = generateEncryptionKey();
    return /^[a-f0-9]{64}$/i.test(key);
  });

  test("round-trip encryption should work", () => {
    const passwords = ["simple", "complex123!@#", "veryLongPassword"];
    return passwords.every(password => {
      const encrypted = encryptPassword(password);
      const decrypted = decryptPassword(encrypted);
      return decrypted === password;
    });
  });

  test("decryptPassword should throw on invalid data", () => {
    try {
      decryptPassword("invalid:format");
      return false; // Should have thrown
    } catch {
      return true; // Expected to throw
    }
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log("🎉 All encryption tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Check implementation.");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
