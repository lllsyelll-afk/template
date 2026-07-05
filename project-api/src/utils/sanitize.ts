/**
 * Input sanitization utilities to prevent NoSQL injection attacks
 */

import { ObjectId } from "mongodb";

/**
 * Escapes special regex characters to prevent ReDoS and regex injection
 * @param input - Raw user input string
 * @returns Sanitized string safe for use in RegExp
 */
export function sanitizeRegex(input: string): string {
  if (typeof input !== "string") return "";
  // Escape regex special characters: .*+?^${}()|[]\-
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitizes user input to prevent MongoDB operator injection
 * Removes $ and . characters that could be used for operator injection
 * @param input - Raw user input
 * @returns Sanitized string with operators removed
 */
export function sanitizeMongoQuery(input: string): string {
  if (typeof input !== "string") return "";
  // Remove MongoDB operators ($) and dot notation (.) that enable injection
  return input.replace(/[$.]/g, "");
}

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - ID string to validate
 * @returns Boolean indicating if valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  // Check length (24 hex chars) and hex format
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validates ObjectId and returns boolean, preventing injection through invalid IDs
 * @param id - ID string from user input
 * @returns true if valid ObjectId format
 */
export function validateObjectId(id: string): boolean {
  try {
    if (!isValidObjectId(id)) return false;
    // Additional validation by attempting ObjectId construction
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a search query for safe use in MongoDB text search
 * Removes dangerous characters while preserving search intent
 * @param query - Raw search query
 * @returns Sanitized query string
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") return "";
  return query
    .trim()
    // Remove MongoDB operators
    .replace(/[$.]/g, "")
    // Remove null bytes
    .replace(/\x00/g, "")
    // Normalize excessive whitespace
    .replace(/\s+/g, " ");
}

/**
 * Sanitizes user input to ensure it's a safe string for equality matching
 * Returns null if input is not a valid safe string
 * @param input - Raw user input
 * @returns Sanitized string or null if invalid
 */
export function sanitizeString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const sanitized = input.trim();
  // Reject empty strings
  if (sanitized.length === 0) return null;
  // Check for MongoDB operator injection attempts
  if (sanitized.includes("$") || sanitized.startsWith("{")) {
    return null;
  }
  return sanitized;
}

/**
 * Wraps a string in $eq operator for safe MongoDB matching
 * Prevents operator injection by explicitly using equality comparison
 * @param value - Value to wrap
 * @returns MongoDB query object with $eq operator
 */
export function eq(value: string): { $eq: string } {
  return { $eq: sanitizeMongoQuery(value) };
}
