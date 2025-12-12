/**
 * Plan utility functions for frontend-only transformations
 * All business logic here is client-side only
 */

import { Plan } from "@/components/PlanCard";
import { getDiscount } from "./admin-discounts";

/**
 * Calculate GB from volume in bytes
 */
export function calculateGB(volumeBytes: number): number {
  return volumeBytes / 1024 / 1024 / 1024;
}

/**
 * Calculate final price with discount (frontend only)
 * This does NOT modify backend data
 * 
 * @param basePriceUSD - Price in USD (already includes backend markup)
 * @param discountPercent - Discount percentage (0-100)
 * @returns Final price in USD after discount
 */
export function calculateFinalPrice(
  basePriceUSD: number,
  discountPercent: number = 0
): number {
  if (discountPercent <= 0) {
    return basePriceUSD;
  }
  
  const discountAmount = basePriceUSD * (discountPercent / 100);
  return Math.max(0, basePriceUSD - discountAmount);
}

/**
 * Convert any currency amount to USD equivalent
 * Uses existing currency conversion logic from CurrencyProvider
 * 
 * @param amount - Amount in source currency
 * @param sourceCurrency - Source currency code
 * @param rates - Exchange rates object (USD = 1.0)
 * @returns USD equivalent
 */
export function convertToUSD(
  amount: number,
  sourceCurrency: string,
  rates: Record<string, number>
): number {
  if (sourceCurrency === "USD") {
    return amount;
  }
  
  const rate = rates[sourceCurrency];
  if (!rate || rate === 0) {
    // If rate not available, assume 1:1 (not ideal but safe)
    return amount;
  }
  
  // Convert from source currency to USD
  // If rate is 3.5, then 3.5 EUR = 1 USD, so 7 EUR = 2 USD
  // So: amount / rate = USD
  return amount / rate;
}

/**
 * Get final price in USD for a plan (with discount applied frontend-only)
 * Backend already returns price in USD after markup
 */
export function getFinalPriceUSD(
  plan: Plan,
  discountPercent?: number
): number {
  // Get base price in USD (backend already applied markup)
  // plan.price is already in USD from backend
  const basePriceUSD = plan.price || 0;
  
  // Apply frontend discount if provided
  const finalPrice = discountPercent !== undefined && discountPercent > 0
    ? calculateFinalPrice(basePriceUSD, discountPercent)
    : basePriceUSD;
  
  return finalPrice;
}

/**
 * Check if plan should be visible (>= $3 USD)
 * Backend prices are already in USD, so we compare directly
 */
export function isPlanVisible(
  plan: Plan,
  discountPercent?: number
): boolean {
  const finalPriceUSD = getFinalPriceUSD(plan, discountPercent);
  return finalPriceUSD >= 3.0;
}

/**
 * GB sizes we don't sell - filter these out
 */
const EXCLUDED_GB_SIZES = [0.5, 1.5, 2.0];

/**
 * Check if a GB size should be excluded
 */
function isExcludedGBSize(gb: number): boolean {
  const rounded = Math.round(gb * 10) / 10; // Round to 1 decimal
  return EXCLUDED_GB_SIZES.includes(rounded);
}

/**
 * Group plans by data size (GB)
 * Filters out excluded GB sizes (0.5GB, 1.5GB, 2GB)
 */
export function groupPlansByDataSize(plans: Plan[]): Map<number, Plan[]> {
  const grouped = new Map<number, Plan[]>();
  
  for (const plan of plans) {
    const gb = calculateGB(plan.volume);
    const roundedGB = Math.round(gb * 10) / 10; // Round to 1 decimal
    
    // Skip excluded GB sizes
    if (isExcludedGBSize(roundedGB)) {
      continue;
    }
    
    if (!grouped.has(roundedGB)) {
      grouped.set(roundedGB, []);
    }
    grouped.get(roundedGB)!.push(plan);
  }
  
  return grouped;
}

/**
 * Get unique durations for a given data size
 */
export function getDurationsForSize(
  plans: Plan[],
  targetGB: number
): Array<{ duration: number; durationUnit: string; plan: Plan }> {
  const gb = calculateGB;
  const matches = plans.filter(
    (plan) => Math.round(gb(plan.volume) * 10) / 10 === targetGB
  );
  
  // Filter to only visible plans (>= $3)
  const visible = matches.filter((plan) => {
    const gb = calculateGB(plan.volume);
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
  
  // Get unique duration combinations
  const seen = new Set<string>();
  const durations: Array<{ duration: number; durationUnit: string; plan: Plan }> = [];
  
  for (const plan of visible) {
    const key = `${plan.duration}-${plan.durationUnit}`;
    if (!seen.has(key)) {
      seen.add(key);
      durations.push({
        duration: plan.duration,
        durationUnit: plan.durationUnit,
        plan,
      });
    }
  }
  
  // Sort by duration (ascending)
  return durations.sort((a, b) => {
    // Normalize to days for comparison
    const aDays = a.durationUnit.toLowerCase() === "day" ? a.duration : a.duration * 30;
    const bDays = b.durationUnit.toLowerCase() === "day" ? b.duration : b.duration * 30;
    return aDays - bDays;
  });
}

/**
 * Filter plans to only those >= $3 USD and exclude 0.5GB, 1.5GB, 2GB
 */
export function filterVisiblePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => {
    // Exclude specific GB sizes we don't sell
    const gb = calculateGB(plan.volume);
    if (isExcludedGBSize(gb)) {
      return false;
    }
    
    // Filter by price (>= $3 USD)
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
}

