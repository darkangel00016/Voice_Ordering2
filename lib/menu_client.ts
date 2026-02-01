/**
 * lib/menuClient.ts
 * 
 * Responsible for fetching menu data from an external API.
 * Includes basic in-memory caching to prevent redundant network requests
 * and normalizes errors for consistent handling by the UI/Logic layers.
 */

import { MenuItem } from './types';
import { config } from './env_config';

// --- Internal State for Caching ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let menuCache: CacheEntry<MenuItem[]> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Custom error class for Menu operations to distinguish from generic runtime errors.
 */
export class MenuFetchError extends Error {
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(message: string, code: string = 'MENU_FETCH_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'MenuFetchError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Fetches the current menu items.
 * 
 * Strategies:
 * 1. Checks in-memory cache first.
 * 2. If cache is stale or empty, fetches from the configured API endpoint.
 * 3. Normalizes network or parsing errors into a MenuFetchError.
 * 
 * @returns Promise<MenuItem[]> List of available menu items.
 * @throws MenuFetchError if the retrieval fails completely.
 */
export async function fetchMenu(): Promise<MenuItem[]> {
  // 1. Check Cache
  if (menuCache) {
    const isExpired = (Date.now() - menuCache.timestamp) > CACHE_TTL_MS;
    if (!isExpired) {
      return menuCache.data;
    }
  }

  try {
    const queryParams = {
      origin: 'API'
    };
    const queryString = new URLSearchParams(queryParams).toString();
    const fullUrl = `${config.menuApiBaseUrl}?${queryString}`;
    // 2. Fetch from API
    // Note: In a real scenario, we might append a timestamp or version query param
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
    });
    if (!response.ok) {
      throw new MenuFetchError(
        `Failed to fetch menu: ${response.status} ${response.statusText}`,
        'HTTP_ERROR'
      );
    }

    // 3. Parse and Validate
    // We expect the API to return ApiResult<MenuItem[]> or just MenuItem[]
    // This logic handles a direct array return or a wrapped response.
    const json = await response.json();
    const items = normalizeMenuPayload(json);

    // 4. Update Cache
    menuCache = {
      data: items,
      timestamp: Date.now()
    };

    return items;

  } catch (error) {
    // 5. Error Normalization
    if (error instanceof MenuFetchError) {
      throw error;
    }
    
    // Fallback for network errors (e.g., DNS failure, offline)
    throw new MenuFetchError(
      'Network error occurred while retrieving the menu.',
      'NETWORK_ERROR',
      error
    );
  }
}

type CategoryPayload = {
  id: string | number;
  name: string;
  description?: string | null;
  image?: string | null;
  plates?: PlatePayload[];
};

type PlatePayload = {
  id: string | number;
  name: string;
  description?: string | null;
  price?: string | number | null;
  image?: string | null;
};

function normalizeMenuPayload(payload: unknown): MenuItem[] {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return [];
    }
    const first = payload[0] as Record<string, unknown>;
    if ("price" in first) {
      return payload as MenuItem[];
    }
    if ("plates" in first) {
      return flattenCategories(payload as CategoryPayload[]);
    }
  }

  if (payload && typeof payload === "object") {
    const dataPayload = payload as Record<string, unknown>;
    if (Array.isArray(dataPayload.data)) {
      return normalizeMenuPayload(dataPayload.data);
    }
    if (Array.isArray(dataPayload.categories)) {
      return flattenCategories(dataPayload.categories as CategoryPayload[]);
    }
    if (Array.isArray(dataPayload.menu)) {
      return normalizeMenuPayload(dataPayload.menu);
    }
  }

  throw new MenuFetchError('Invalid menu data format received from API', 'INVALID_FORMAT');
}

function flattenCategories(categories: CategoryPayload[]): MenuItem[] {
  const items: MenuItem[] = [];
  for (const category of categories) {
    const plates = category.plates || [];
    for (const plate of plates) {
      items.push({
        id: String(plate.id),
        name: plate.name,
        description: plate.description || "",
        basePrice: Number(plate.price || 0),
        category: category.name,
        imageUrl: plate.image || category.image || undefined,
        isAvailable: true,
        modifierGroups: [],
      });
    }
  }
  return items;
}

/**
 * Force clears the local menu cache.
 * Useful for admin actions or when the user explicitly requests a refresh.
 */
export function clearMenuCache(): void {
  menuCache = null;
}

// --- Mock Data Fallback (Optional / Development Utility) ---

/**
 * A utility to simulate the API call for local development if the real API is unreachable.
 * Can be swapped into fetchMenu() during prototyping.
 */
export async function fetchMockMenu(): Promise<MenuItem[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    {
      id: "item_101",
      name: "Classic Burger",
      description: "Beef patty, lettuce, tomato, onion, pickles",
      basePrice: 12.00,
      category: "Entrees",
      isAvailable: true,
      modifierGroups: [
        {
          id: "mod_cheese",
          name: "Cheese",
          minSelection: 0,
          maxSelection: 1,
          options: [
            { id: "opt_cheddar", name: "Cheddar", priceAdjustment: 1.00, isAvailable: true },
            { id: "opt_swiss", name: "Swiss", priceAdjustment: 1.00, isAvailable: true }
          ]
        }
      ]
    },
    {
      id: "item_102",
      name: "Fries",
      description: "Crispy golden fries",
      basePrice: 4.00,
      category: "Sides",
      isAvailable: true,
      modifierGroups: []
    }
  ];
}
