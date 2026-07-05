/**
 * Timezone Utility
 * 
 * This module provides utilities for handling timezone conversions
 * between UTC (server-side storage) and local time (client-side display).
 * 
 * to the user's local timezone for display.
 */

/**
 * Get the user's timezone from the browser
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Create a UTC Date object from a date string and time string in the user's timezone
 * @param dateStr - Date in YYYY-MM-DD format
 * @param timeStr - Time in HH:MM format
 * @param timezone - User's timezone (e.g., 'Africa/Algiers')
 * @returns UTC Date object
 */
export function toUTC(dateStr: string, timeStr: string, timezone: string): Date {
  // Parse the date and time
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Create a date string in ISO format with the user's timezone
  const isoString = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  // Create date in user's timezone, then get UTC timestamp
  const date = new Date(isoString);

  // Adjust for timezone offset
  const tzDate = new Date(
    date.toLocaleString("en-US", { timeZone: timezone })
  );
  const utcDate = new Date(
    date.toLocaleString("en-US", { timeZone: "UTC" })
  );
  const offset = utcDate.getTime() - tzDate.getTime();

  return new Date(date.getTime() + offset);
}

/**
 * Convert a UTC Date to local date string and time string
 * @param utcDate - UTC Date object
 * @param timezone - Target timezone
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) in local timezone
 */
export function fromUTC(
  utcDate: Date,
  timezone: string
): { date: string; time: string } {
  if (isNaN(utcDate.getTime())) {
    return { date: "", time: "" };
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(utcDate);

  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || "";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

/**
 * Format a UTC Date to a display string in local timezone
 * @param utcDate - UTC Date object
 * @param timezone - Target timezone
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatUTCToLocal(
  utcDate: Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  return new Intl.DateTimeFormat(
    navigator.language || "en-US",
    { ...defaultOptions, ...options }
  ).format(utcDate);
}

/**
 * Check if a date string represents a valid date
 */
export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Check if a time string represents a valid time
 */
export function isValidTime(timeStr: string): boolean {
  const regex = /^\d{2}:\d{2}$/;
  if (!regex.test(timeStr)) return false;

  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Get current date in YYYY-MM-DD format in user's timezone
 */
export function getLocalDate(timezone: string): string {
  const now = new Date();
  const { date } = fromUTC(now, timezone);
  return date;
}

/**
 * Parse UTC date string back to Date object
 * Handles both ISO strings and date strings
 */
export function parseUTCDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
}
