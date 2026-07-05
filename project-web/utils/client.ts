import { getDevApiBaseUrl } from "./devConfig";
import { cache } from "./cache";
import { Capacitor } from "@capacitor/core";

// Cache configuration: defines which endpoints should be cached
// Format: "METHOD /path/pattern" -> true to enable caching
// Use * as wildcard for path matching
const CACHE_CONFIG: Record<string, boolean> = {
};

function shouldCache(method: string, path: string): boolean {
  const cacheKey = `${method} ${path}`;

  for (const [pattern, enabled] of Object.entries(CACHE_CONFIG)) {
    if (!enabled) continue;

    // Exact match
    if (pattern === cacheKey) return true;

    // Wildcard match
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, "[^/]*") + "$");
      if (regex.test(cacheKey)) return true;
    }
  }

  return false;
}

function generateCacheKey(
  method: string,
  path: string,
  body?: unknown,
): string {
  if (body === undefined) return `api:${method}:${path}`;
  // Include body hash in cache key for requests with body
  const bodyHash = JSON.stringify(body);
  return `api:${method}:${path}:${bodyHash}`;
}
export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const version: string | undefined = import.meta.env.VITE_API_VERSION;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // Check if this request should be cached
  const shouldUseCache = shouldCache(method, path);
  const cacheKey = generateCacheKey(method, path, body);

  if (shouldUseCache) {
    if (import.meta.env.DEV) {
      console.log(
        `%cCACHE: [${method}] ${path}`,
        "color: #10b981; font-weight: bold",
      );
    }
    const cached = cache.get<T>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
  }

  const headers: Record<string, string> = {};
  if (version) {
    headers["X-Api-Version"] = version;
  }
  if (Capacitor.isNativePlatform() && import.meta.env.VITE_NATIVE_APP_KEY) {
    headers["X-App-Key"] = import.meta.env.VITE_NATIVE_APP_KEY;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const baseUrl = getDevApiBaseUrl();

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // ignore JSON parse error
    }
  }
  if (!res.ok) {
    const message =
      (json && typeof json === "object" && "error" in json
        ? String((json as { error: unknown }).error)
        : null) || `HTTP ${res.status}`;
    throw new ApiError(message, res.status, json ?? text);
  }

  const result = (json as T) ?? ({} as T);

  // Store in cache if configured
  if (shouldUseCache) {
    cache.set(cacheKey, result);
  }

  return result;
}
export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
