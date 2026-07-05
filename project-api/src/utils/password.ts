/**
 * Password validation utility
 * Enforces simple password requirements
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/**
 * Validates password against simple requirements
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - Only alphanumeric characters (letters + numbers)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check length
  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }
  if (password.length > MAX_LENGTH) {
    errors.push(`Password must not exceed ${MAX_LENGTH} characters`);
  }

  // Check if password contains only alphanumeric characters
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    errors.push("Password must contain only letters and numbers");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates password strength score (0-4)
 * Returns a visual indicator level for the UI
 */
export function getPasswordStrength(password: string): number {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  return Math.min(score, 4);
}

/**
 * Returns a user-friendly strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  return labels[score] || "Very Weak";
}
