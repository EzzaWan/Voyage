/**
 * Discount management for mobile app
 * Fetches discounts from backend API (same as web app)
 */

import { apiFetch } from '../api/client';

export interface DiscountMap {
  [planId: string]: number; // planId -> discountPercent (0-100)
}

export interface GlobalDiscountMap {
  [gbSize: string]: number; // GB size as string -> discountPercent (0-100)
}

interface DiscountsResponse {
  global: GlobalDiscountMap;
  individual: DiscountMap;
}

// Cache for discounts
let discountsCache: DiscountsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Fetch discounts from backend API (with caching)
 */
export async function fetchDiscounts(): Promise<DiscountsResponse> {
  const now = Date.now();
  
  // Return cached if valid
  if (discountsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return discountsCache;
  }

  try {
    const data = await apiFetch<DiscountsResponse>('/admin/discounts');
    
    discountsCache = {
      global: data.global || {},
      individual: data.individual || {},
    };
    cacheTimestamp = now;
    
    return discountsCache;
  } catch (error) {
    console.warn('[DISCOUNTS] Failed to fetch discounts:', error);
    // Return empty on error
    return { global: {}, individual: {} };
  }
}

/**
 * Clear discounts cache
 */
export function clearDiscountsCache(): void {
  discountsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get discount for a specific plan (synchronous, uses cache)
 * Priority: Individual plan discount > Global GB discount
 * 
 * Note: Call fetchDiscounts() first to populate cache
 * 
 * @param planId - Plan code/ID
 * @param planGB - GB size of the plan (optional, for global discount fallback)
 * @returns Discount percentage (0-100)
 */
export function getDiscount(planId: string, planGB?: number): number {
  if (!discountsCache) {
    return 0;
  }
  
  const { individual, global } = discountsCache;
  
  // First check individual plan discount
  if (individual[planId] !== undefined && individual[planId] !== null) {
    return individual[planId];
  }
  
  // Fall back to global GB discount if GB size provided
  if (planGB !== undefined) {
    const roundedGB = Math.round(planGB * 10) / 10;
    const gbKey = roundedGB.toString();
    return global[gbKey] || 0;
  }
  
  return 0;
}

/**
 * Get global discount by GB size (synchronous, uses cache)
 */
export function getGlobalDiscountByGB(gbSize: number): number {
  if (!discountsCache) {
    return 0;
  }
  
  const roundedGB = Math.round(gbSize * 10) / 10;
  const gbKey = roundedGB.toString();
  return discountsCache.global[gbKey] || 0;
}

/**
 * Check if discounts are loaded
 */
export function areDiscountsLoaded(): boolean {
  return discountsCache !== null;
}

/**
 * Calculate final price with discount
 */
export function calculateDiscountedPrice(basePrice: number, discountPercent: number): number {
  if (discountPercent <= 0) return basePrice;
  return Math.max(0, basePrice * (1 - discountPercent / 100));
}

/**
 * Format discount for display
 */
export function formatDiscount(discountPercent: number): string {
  if (discountPercent <= 0) return '';
  return `-${Math.round(discountPercent)}%`;
}






