// Input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: unknown;
}

// Phone number validation (Algerian format)
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone) {
    errors.push("Phone number is required");
    return { isValid: false, errors };
  }

  const sanitized = phone.trim();

  // Check if it starts with +213 (Algeria country code)
  if (!sanitized.startsWith("+213")) {
    errors.push("Phone number must start with +213 (Algeria country code)");
  }

  // Check length (should be +213 followed by 9 digits)
  if (sanitized.length !== 13) {
    errors.push("Phone number must be 13 characters long (including +213)");
  }

  // Check if remaining characters are digits
  const digits = sanitized.substring(4);
  if (!/^\d{9}$/.test(digits)) {
    errors.push("Phone number must contain only digits after +213");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    return { isValid: true, errors: [] }; // Email is optional
  }

  const sanitized = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    errors.push("Invalid email format");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name) {
    errors.push("Name is required");
    return { isValid: false, errors };
  }

  const sanitized = name.trim();

  if (sanitized.length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (sanitized.length > 50) {
    errors.push("Name must be less than 50 characters long");
  }

  // Check for potentially harmful characters
  const dangerousChars = /[<>"'&]/;
  if (dangerousChars.test(sanitized)) {
    errors.push("Name contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password.length > 100) {
    errors.push("Password must be less than 100 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// API key validation
export const validateApiKey = (apiKey: string): ValidationResult => {
  const errors: string[] = [];

  if (!apiKey) {
    errors.push("API key is required");
    return { isValid: false, errors };
  }

  const sanitized = apiKey.trim();

  if (sanitized.length < 10) {
    errors.push("API key appears to be too short");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};

// Multiple choice selection validation
export const validateChoice = (
  choice: string,
  options: string[],
): ValidationResult => {
  const errors: string[] = [];

  if (!choice) {
    errors.push("Choice is required");
    return { isValid: false, errors };
  }

  const sanitized = choice.trim();
  const index = parseInt(sanitized) - 1;

  if (isNaN(index) || index < 0 || index >= options.length) {
    errors.push(
      `Invalid choice. Please select a number between 1 and ${options.length}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? index : undefined,
  };
};

// General input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
};

// Validate user input for CLI
export const validateUserInput = (
  input: string,
  type: "phone" | "email" | "name" | "password" | "apikey",
): ValidationResult => {
  switch (type) {
    case "phone":
      return validatePhone(input);
    case "email":
      return validateEmail(input);
    case "name":
      return validateName(input);
    case "password":
      return validatePassword(input);
    case "apikey":
      return validateApiKey(input);
    default:
      return {
        isValid: false,
        errors: ["Unknown validation type"],
      };
  }
};
