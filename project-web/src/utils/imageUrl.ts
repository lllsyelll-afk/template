/**
 * Replaces localhost in image URLs with the current window origin in dev mode.
 * This ensures photos load correctly when the app is accessed from any
 * device on the same network (e.g. mobile on LAN).
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Only apply in development mode
  if (!import.meta.env.DEV) {
    return url;
  }

  // If the URL contains localhost, strip the origin and make it relative
  // so it works from any client (localhost, LAN IP, etc.) regardless of port
  if (url.includes("localhost")) {
    return url.replace(/^https?:\/\/localhost(:\d+)?/, "");
  }

  return url;
}
