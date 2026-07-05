import { useMemo } from "react";
import { fromUTC, getUserTimezone } from "@/utils/timezone";

/**
 * Hook to convert UTC data to local timezone
 */
export function useLocalTime(utcDateStr: string | Date | undefined, timeStr?: string) {
  const timezone = getUserTimezone();

  return useMemo(() => {
    if (!utcDateStr) return { date: "", time: "", formatted: "" };

    try {
      const utcDate = utcDateStr instanceof Date ? utcDateStr : new Date(utcDateStr);

      // If we have a separate time string, combine them
      let fullDate = utcDate;
      if (timeStr) {
        const [year, month, day] = utcDate.toISOString().split("T")[0].split("-").map(Number);
        const [hours, minutes] = timeStr.split(":").map(Number);
        fullDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      }

      const local = fromUTC(fullDate, timezone);

      return {
        date: local.date,
        time: local.time,
        formatted: new Intl.DateTimeFormat(navigator.language || "en-US", {
          timeZone: timezone,
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(fullDate),
      };
    } catch {
      return { date: "", time: "", formatted: "" };
    }
  }, [utcDateStr, timeStr, timezone]);
}
