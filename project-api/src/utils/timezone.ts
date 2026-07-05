/**
 * Server-side Timezone Utilities
 * 
 * Handles timezone conversions between UTC (database storage) and local time (client display).
 */

/**
 * Convert client-side date/time in a specific timezone to UTC Date
 */
export function toUTC(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  const isoString = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  const date = new Date(isoString);
  
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
 * Convert UTC Date to client-side date/time strings
 */
export function fromUTC(
  utcDate: Date,
  timezone: string
): { date: string; time: string } {
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

  return {
    date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    time: `${getPart("hour")}:${getPart("minute")}`,
  };
}

/**
 * Format UTC Date to localized string
 */
export function formatUTCToLocal(
  utcDate: Date,
  timezone: string,
  locale = "en-US",
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

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(utcDate);
}
