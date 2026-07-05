interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

interface CacheOptions {
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

class CacheRegistry {
  private storage = new Map<string, CacheEntry<unknown>>();

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttlMs;
  }

  /**
   * Get cached data by key. Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.storage.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.storage.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Set data in cache with a key and optional TTL.
   * Default TTL is 5 minutes if not specified.
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };

    this.storage.set(key, entry as CacheEntry<unknown>);
  }

  /**
   * Check if a key exists in cache and is not expired.
   */
  has(key: string): boolean {
    const entry = this.storage.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific key from cache.
   */
  delete(key: string): boolean {
    return this.storage.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern (supports * wildcard).
   */
  invalidate(pattern: string): void {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.storage.keys()) {
      if (regex.test(key)) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Get all cache keys (excluding expired entries).
   */
  keys(): string[] {
    const result: string[] = [];
    for (const [key, entry] of this.storage.entries()) {
      if (!this.isExpired(entry)) {
        result.push(key);
      } else {
        this.storage.delete(key);
      }
    }
    return result;
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get current number of cached entries.
   */
  size(): number {
    let count = 0;
    for (const [key, entry] of this.storage.entries()) {
      if (!this.isExpired(entry)) {
        count++;
      } else {
        this.storage.delete(key);
      }
    }
    return count;
  }
}

export const cache = new CacheRegistry();
