const STORAGE_KEY = "dev_api_base_url";
const DEFAULT_URL =
  import.meta.env.VITE_API_URL || "http://localhost:45231/api";
export function getDevApiBaseUrl(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && stored.trim() ? stored.trim() : DEFAULT_URL;
}
export function setDevApiBaseUrl(url: string | null): void {
  if (url && url.trim()) {
    localStorage.setItem(STORAGE_KEY, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
export function getDefaultApiBaseUrl(): string {
  return DEFAULT_URL;
}
