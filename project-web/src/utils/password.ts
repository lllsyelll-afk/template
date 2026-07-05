/**
 * Password validation utility for frontend
 * Mirrors backend validation for real-time feedback
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

/**
 * Password requirements list for UI display
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "Maximum 128 characters",
    test: (pwd) => pwd.length <= 128,
  },
  {
    label: "Only letters and numbers",
    test: (pwd) => /^[a-zA-Z0-9]+$/.test(pwd),
  },
];

/**
 * Validates password against all requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.test(password)) {
      errors.push(req.label);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks which requirements are met (for real-time UI feedback)
 */
export function checkPasswordRequirements(password: string): {
  requirement: string;
  met: boolean;
}[] {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    requirement: req.label,
    met: req.test(password),
  }));
}

/**
 * Calculates password strength score (0-4)
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

/**
 * Returns color for strength indicator
 */
export function getPasswordStrengthColor(score: number): string {
  const colors = ["bg-red-500", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  return colors[score] || "bg-red-500";
}
