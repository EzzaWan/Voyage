/**
 * Discount management - fetches from backend API
 * Discounts are stored in backend (AdminSettings) and visible to all users
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface DiscountMap {
  [planId: string]: number; // planId -> discountPercent (0-100)
}

export interface GlobalDiscountMap {
  [gbSize: string]: number; // GB size as string -> discountPercent (0-100)
}

// Cache for discounts (cleared after updates)
let discountsCache: { global: GlobalDiscountMap; individual: DiscountMap } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Fetch discounts from backend API (with caching)
 */
export async function fetchDiscounts(): Promise<{ global: GlobalDiscountMap; individual: DiscountMap }> {
  // Return cached if valid
  const now = Date.now();
  if (discountsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return discountsCache;
  }

  try {
    const response = await fetch(`${API_URL}/admin/discounts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch discounts: ${response.statusText}`);
    }
    const data = await response.json();
    
    discountsCache = {
      global: data.global || {},
      individual: data.individual || {},
    };
    cacheTimestamp = now;
    
    return discountsCache;
  } catch (error) {
    console.error("[DISCOUNTS] Failed to fetch discounts from backend:", error);
    // Return empty on error
    return { global: {}, individual: {} };
  }
}

/**
 * Clear discounts cache (call after updating)
 */
export function clearDiscountsCache(): void {
  discountsCache = null;
  cacheTimestamp = 0;
}

/**
 * Save discounts to backend (admin only)
 * @param discounts - Discount data to save
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function saveDiscounts(
  discounts: { global?: GlobalDiscountMap; individual?: DiscountMap },
  adminEmail?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add admin email header if provided (required for admin-only POST endpoint)
    if (adminEmail) {
      headers['x-admin-email'] = adminEmail;
    }
    
    const response = await fetch(`${API_URL}/admin/discounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(discounts),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save discounts: ${error}`);
    }
    
    // Clear cache after update
    clearDiscountsCache();
  } catch (error) {
    console.error("[DISCOUNTS] Failed to save discounts:", error);
    throw error;
  }
}

// Legacy functions for backward compatibility (load from cache/API)
export function loadDiscounts(): DiscountMap {
  // This is now async, but we keep sync version for compatibility
  // Components should use getDiscount() which is async-aware
  return discountsCache?.individual || {};
}

// Legacy functions - kept for compatibility, use fetchDiscounts() instead
export function loadGlobalDiscounts(): GlobalDiscountMap {
  return discountsCache?.global || {};
}

export async function saveGlobalDiscounts(discounts: GlobalDiscountMap): Promise<void> {
  const current = discountsCache || { global: {}, individual: {} };
  await saveDiscounts({ ...current, global: discounts });
}

/**
 * Get global discount for a specific GB size (from cache)
 */
export function getGlobalDiscountByGB(gbSize: number): number {
  const globalDiscounts = loadGlobalDiscounts();
  // Round to 1 decimal for consistency
  const roundedGB = Math.round(gbSize * 10) / 10;
  const gbKey = roundedGB.toString();
  return globalDiscounts[gbKey] || 0;
}

/**
 * Set global discount for a specific GB size (saves to backend)
 */
export async function setGlobalDiscountByGB(gbSize: number, discountPercent: number): Promise<void> {
  const current = await fetchDiscounts();
  const globalDiscounts = { ...current.global };
  const roundedGB = Math.round(gbSize * 10) / 10;
  const gbKey = roundedGB.toString();
  
  if (discountPercent > 0 && discountPercent <= 100) {
    globalDiscounts[gbKey] = discountPercent;
  } else {
    delete globalDiscounts[gbKey];
  }
  await saveDiscounts({ global: globalDiscounts, individual: current.individual });
}

/**
 * Remove global discount for a specific GB size (saves to backend)
 */
export async function removeGlobalDiscountByGB(gbSize: number): Promise<void> {
  const current = await fetchDiscounts();
  const globalDiscounts = { ...current.global };
  const roundedGB = Math.round(gbSize * 10) / 10;
  const gbKey = roundedGB.toString();
  delete globalDiscounts[gbKey];
  await saveDiscounts({ global: globalDiscounts, individual: current.individual });
}

/**
 * Get all global discounts
 */
export function getAllGlobalDiscounts(): GlobalDiscountMap {
  return loadGlobalDiscounts();
}

/**
 * Get discount for a specific plan (synchronous, uses cache)
 * Priority: Individual plan discount > Global GB discount
 * 
 * Note: This uses cached discounts. Call fetchDiscounts() first to ensure cache is populated.
 * 
 * @param planId - Plan code/ID
 * @param planGB - GB size of the plan (optional, for global discount fallback)
 * @returns Discount percentage (0-100)
 */
export function getDiscount(planId: string, planGB?: number): number {
  const discounts = loadDiscounts();
  const globalDiscounts = loadGlobalDiscounts();
  
  // First check individual plan discount
  if (discounts[planId] !== undefined && discounts[planId] !== null) {
    return discounts[planId];
  }
  
  // Fall back to global GB discount if GB size provided
  if (planGB !== undefined) {
    const roundedGB = Math.round(planGB * 10) / 10;
    const gbKey = roundedGB.toString();
    return globalDiscounts[gbKey] || 0;
  }
  
  return 0;
}

/**
 * Set discount for a specific plan (saves to backend)
 */
export async function setDiscount(planId: string, discountPercent: number): Promise<void> {
  const current = await fetchDiscounts();
  const discounts = { ...current.individual };
  
  if (discountPercent > 0 && discountPercent <= 100) {
    discounts[planId] = discountPercent;
  } else {
    delete discounts[planId];
  }
  await saveDiscounts({ global: current.global, individual: discounts });
}

/**
 * Remove discount for a specific plan (saves to backend)
 */
export async function removeDiscount(planId: string): Promise<void> {
  const current = await fetchDiscounts();
  const discounts = { ...current.individual };
  delete discounts[planId];
  await saveDiscounts({ global: current.global, individual: discounts });
}

/**
 * Clear all discounts (saves to backend)
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function clearDiscounts(adminEmail?: string): Promise<void> {
  await saveDiscounts({ global: {}, individual: {} }, adminEmail);
}

/**
 * Clear all global discounts (saves to backend)
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function clearGlobalDiscounts(adminEmail?: string): Promise<void> {
  const current = await fetchDiscounts();
  await saveDiscounts({ global: {}, individual: current.individual }, adminEmail);
}

/**
 * Export discounts as JSON string (includes both individual and global)
 */
export function exportDiscounts(): string {
  const discounts = loadDiscounts();
  const globalDiscounts = loadGlobalDiscounts();
  return JSON.stringify({
    global: globalDiscounts,
    individual: discounts,
  }, null, 2);
}

/**
 * Import discounts from JSON string and save to backend
 * Supports both old format (just individual discounts) and new format (global + individual)
 * @param jsonString - JSON string to import
 * @param adminEmail - Admin email for authentication (required for POST)
 */
export async function importDiscounts(
  jsonString: string,
  adminEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: "Invalid format: must be an object" };
    }
    
    // Check if it's new format (has global and individual keys)
    if (parsed.global !== undefined || parsed.individual !== undefined) {
      // New format: { global: {...}, individual: {...} }
      const validatedGlobal: GlobalDiscountMap = {};
      const validatedIndividual: DiscountMap = {};
      
      if (parsed.global && typeof parsed.global === "object") {
        for (const [gbSize, discount] of Object.entries(parsed.global)) {
          const num = Number(discount);
          if (isNaN(num) || num < 0 || num > 100) {
            return { success: false, error: `Invalid global discount for ${gbSize}GB: must be 0-100` };
          }
          validatedGlobal[gbSize] = num;
        }
      }
      
      if (parsed.individual && typeof parsed.individual === "object") {
        for (const [planId, discount] of Object.entries(parsed.individual)) {
          if (typeof planId !== "string") {
            return { success: false, error: `Invalid plan ID: ${planId} must be a string` };
          }
          const num = Number(discount);
          if (isNaN(num) || num < 0 || num > 100) {
            return { success: false, error: `Invalid discount for ${planId}: must be 0-100` };
          }
          validatedIndividual[planId] = num;
        }
      }
      
      await saveDiscounts({ global: validatedGlobal, individual: validatedIndividual }, adminEmail);
      return { success: true };
    } else {
      // Old format: just individual discounts { "PLAN_CODE": 10 }
      const validated: DiscountMap = {};
      for (const [planId, discount] of Object.entries(parsed)) {
        if (typeof planId !== "string") {
          return { success: false, error: `Invalid plan ID: ${planId} must be a string` };
        }
        const num = Number(discount);
        if (isNaN(num) || num < 0 || num > 100) {
          return { success: false, error: `Invalid discount for ${planId}: must be 0-100` };
        }
        validated[planId] = num;
      }
      await saveDiscounts({ individual: validated }, adminEmail);
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


