import { cache } from "@utils/cache";

export interface GeocodedLocation {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  class: string;
  importance: number;
  address: {
    city?: string;
    country?: string;
    state?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
  };
}

export interface GeocodingResult {
  success: boolean;
  locations: GeocodedLocation[];
  error?: string;
}

class GeocodingService {
  private readonly NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes for geocoding

  async searchPlaces(query: string): Promise<GeocodingResult> {
    if (!query.trim()) {
      return { success: true, locations: [] };
    }

    // Check cache first
    const cacheKey = `geocoding:search:${query.toLowerCase().trim()}`;
    const cached = cache.get<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "5",
        "accept-language": "en",
      });

      const response = await fetch(`${this.NOMINATIM_API}?${params}`);

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      const locations: GeocodedLocation[] = data.map(
        (item: {
          display_name: string;
          lat: string;
          lon: string;
          type: string;
          class: string;
          importance: number;
          address: Record<string, any>;
        }) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          class: item.class,
          importance: item.importance,
          address: item.address || {},
        }),
      );

      const result = { success: true, locations };
      
      // Cache successful results
      cache.set(cacheKey, result, { ttlMs: this.CACHE_TTL });
      
      return result;
    } catch (error) {
      console.error("Geocoding error:", error);
      const errorResult = {
        success: false,
        locations: [],
        error:
          error instanceof Error ? error.message : "Unknown geocoding error",
      };
      
      // Cache error results for shorter time
      cache.set(cacheKey, errorResult, { ttlMs: 5 * 60 * 1000 }); // 5 minutes
      
      return errorResult;
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult> {
    // Check cache first
    const cacheKey = `geocoding:reverse:${lat.toFixed(6)}:${lon.toFixed(6)}`;
    const cached = cache.get<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        format: "json",
        addressdetails: "1",
        "accept-language": "en",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        const errorResult = { success: false, locations: [], error: data.error };
        // Cache error results for shorter time
        cache.set(cacheKey, errorResult, { ttlMs: 5 * 60 * 1000 }); // 5 minutes
        return errorResult;
      }

      const location: GeocodedLocation = {
        display_name: data.display_name,
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon),
        type: data.type,
        class: data.class,
        importance: data.importance || 0,
        address: data.address || {},
      };

      const result = { success: true, locations: [location] };
      
      // Cache successful results
      cache.set(cacheKey, result, { ttlMs: this.CACHE_TTL });
      
      return result;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      const errorResult = {
        success: false,
        locations: [],
        error:
          error instanceof Error
            ? error.message
            : "Unknown reverse geocoding error",
      };
      
      // Cache error results for shorter time
      cache.set(cacheKey, errorResult, { ttlMs: 5 * 60 * 1000 }); // 5 minutes
      
      return errorResult;
    }
  }
}

export const geocodingService = new GeocodingService();
