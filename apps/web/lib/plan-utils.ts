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
 * Also exclude any plans <= 1.5GB (except unlimited plans)
 */
const EXCLUDED_GB_SIZES = [0.5, 1.5, 2.0];
const MIN_GB_SIZE = 1.5; // Minimum GB size allowed (exclusive, so > 1.5GB)

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
 * Also filters out 1-day plans except unlimited plans
 * Also filters out plans <= 1.5GB except unlimited plans
 */
export function groupPlansByDataSize(plans: Plan[]): Map<number, Plan[]> {
  const grouped = new Map<number, Plan[]>();
  
  for (const plan of plans) {
    const gb = calculateGB(plan.volume);
    const roundedGB = Math.round(gb * 10) / 10; // Round to 1 decimal
    
    // Skip plans <= 1.5GB (unless unlimited or 1GB 7 days)
    if (gb <= MIN_GB_SIZE) {
      if (!isDailyUnlimitedPlan(plan) && !is1GB7DaysPlan(plan)) {
        continue;
      }
    }
    
    // Skip excluded GB sizes (unless unlimited)
    if (isExcludedGBSize(roundedGB)) {
      if (!isDailyUnlimitedPlan(plan)) {
        continue;
      }
    }
    
    // Skip 1-day plans (unless unlimited)
    const duration = plan.duration || 0;
    const durationUnit = (plan.durationUnit || 'day').toLowerCase();
    const isOneDay = duration === 1 && durationUnit === 'day';
    if (isOneDay && !isDailyUnlimitedPlan(plan)) {
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
  
  // Filter to only visible plans (>= $3) and exclude 1-day plans (except unlimited)
  // Also exclude plans <= 1.5GB (except unlimited)
  const visible = matches.filter((plan) => {
    const gb = calculateGB(plan.volume);
    
    // Exclude plans <= 1.5GB unless they're unlimited or 1GB 7 days
    if (gb <= MIN_GB_SIZE && !isDailyUnlimitedPlan(plan) && !is1GB7DaysPlan(plan)) {
      return false;
    }
    
    const discountPercent = getDiscount(plan.packageCode, gb);
    
    // Exclude 1-day plans unless they're unlimited
    const duration = plan.duration || 0;
    const durationUnit = (plan.durationUnit || 'day').toLowerCase();
    const isOneDay = duration === 1 && durationUnit === 'day';
    if (isOneDay && !isDailyUnlimitedPlan(plan)) {
      return false;
    }
    
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
 * Check if plan should go to Unlimited tab
 * Requirements: 2GB and FUP1Mbps
 */
export function isDailyUnlimitedPlan(plan: Plan): boolean {
  // Must be exactly 2GB (not unlimited -1)
  if (plan.volume === -1) {
    return false;
  }
  const volumeGB = plan.volume / (1024 * 1024 * 1024);
  // Check if it's exactly 2GB (allow small tolerance for rounding)
  if (volumeGB < 1.95 || volumeGB > 2.05) {
    return false;
  }
  
  // Must have FUP1Mbps flag - use more robust detection
  const nameLower = (plan.name || '').toLowerCase();
  
  // Check name for explicit FUP patterns (FUP followed by optional number and Mbps)
  // Use word boundaries to avoid matching "fup" inside other words
  const fupPattern = /\bfup(\d+)?mbps?\b/i;
  const fupStandalone = /\bfup\b/i;
  const fupInName = nameLower.match(fupPattern) || nameLower.match(fupStandalone);
  
  // Check plan object for explicit FUP fields
  const fupInObject = (plan as any).fup === true ||
                      ((plan as any).fupSpeed && typeof (plan as any).fupSpeed === 'number' && (plan as any).fupSpeed === 1) ||
                      (plan as any).fairUsagePolicy === true ||
                      (typeof (plan as any).fup === 'string' && /^fup(\d+)?mbps?$/i.test((plan as any).fup));
  
  // Also check for common variations in name
  const hasFUP1Mbps = fupInName || 
                     fupInObject ||
                     nameLower.includes('fup1mbps') || 
                     nameLower.includes('fup 1mbps') ||
                     nameLower.includes('fup 1 mbps');
  
  // If we have FUP but need to verify it's 1Mbps specifically
  if (hasFUP1Mbps) {
    // Check if speed limit is 1Mbps (or default to 1 if not specified)
    const speedMatch = nameLower.match(/fup(\d+)?mbps?/i);
    const speedLimit = speedMatch 
      ? parseInt(speedMatch[1] || '1')
      : ((plan as any).fupSpeed ? (plan as any).fupSpeed : 1);
    
    // Only return true if speed limit is 1Mbps (or default/unspecified which defaults to 1)
    return speedLimit === 1;
  }
  
  return false;
}

/**
 * Filter plans to only those >= $3 USD and exclude 0.5GB, 1.5GB, 2GB
 * Exception: 2GB plans with FUP1Mbps (unlimited plans) are allowed
 * Also exclude all 1-day plans EXCEPT unlimited plans (2GB + FUP1Mbps)
 * Also exclude all plans <= 1.5GB (except unlimited plans)
 */
export function filterVisiblePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => {
    // Exclude specific GB sizes we don't sell
    const gb = calculateGB(plan.volume);
    
    // Exclude all plans <= 1.5GB (except unlimited plans and 1GB 7 days)
    if (gb <= MIN_GB_SIZE) {
      // Only allow if it's an unlimited plan (2GB + FUP1Mbps) or 1GB 7 days
      if (isDailyUnlimitedPlan(plan) || is1GB7DaysPlan(plan)) {
        // Allow unlimited plans even though they're 2GB
        // Allow 1GB 7 days plans
        // Continue to duration and price check below
      } else {
        // Exclude all other plans <= 1.5GB
        return false;
      }
    }
    
    // Exception: Allow 2GB plans if they are unlimited plans (FUP1Mbps)
    if (isExcludedGBSize(gb)) {
      // Check if this is an unlimited plan (2GB + FUP1Mbps)
      if (isDailyUnlimitedPlan(plan)) {
        // Allow unlimited plans even though they're 2GB
        // Continue to duration and price check below
      } else {
        // Exclude regular 2GB plans
        return false;
      }
    }
    
    // Exclude all 1-day plans EXCEPT unlimited plans (2GB + FUP1Mbps)
    const duration = plan.duration || 0;
    const durationUnit = (plan.durationUnit || 'day').toLowerCase();
    const isOneDay = duration === 1 && durationUnit === 'day';
    
    if (isOneDay) {
      // Only allow 1-day plans if they are unlimited plans
      if (!isDailyUnlimitedPlan(plan)) {
        return false; // Exclude regular 1-day plans
      }
      // Allow 1-day unlimited plans to continue
    }
    
    // Filter by price (>= $3 USD)
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
}

/**
 * Check if a plan has nonhkip flag
 */
function hasNonHKIP(plan: Plan): boolean {
  const nameLower = (plan.name || '').toLowerCase();
  return nameLower.includes('nonhkip') || 
         nameLower.includes('nonhk') ||
         (plan as any).nonhkip === true ||
         (plan as any).ipType === 'nonhkip' ||
         (typeof (plan as any).nonhkip === 'string' && (plan as any).nonhkip.toLowerCase() === 'nonhkip');
}

/**
 * Check if a plan has FUP flag (any FUP, not just 1Mbps)
 */
function hasFUP(plan: Plan): boolean {
  const nameLower = (plan.name || '').toLowerCase();
  const fupPattern = /\bfup(\d+)?mbps?\b/i;
  const fupStandalone = /\bfup\b/i;
  return nameLower.match(fupPattern) !== null || 
         nameLower.match(fupStandalone) !== null ||
         (plan as any).fup === true ||
         (plan as any).fairUsagePolicy === true ||
         (typeof (plan as any).fup === 'string' && /^fup(\d+)?mbps?$/i.test((plan as any).fup));
}

/**
 * Check if a plan is a 1GB 7 days plan (plain, not FUP or nonhkip)
 */
function is1GB7DaysPlan(plan: Plan): boolean {
  const gb = calculateGB(plan.volume);
  const roundedGB = Math.round(gb * 10) / 10;
  
  // Must be exactly 1GB
  if (roundedGB !== 1.0) {
    return false;
  }
  
  // Must be exactly 7 days
  const duration = plan.duration || 0;
  const durationUnit = (plan.durationUnit || 'day').toLowerCase();
  if (duration !== 7 || durationUnit !== 'day') {
    return false;
  }
  
  // Must NOT have FUP or nonhkip flags
  if (hasFUP(plan) || hasNonHKIP(plan)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a plan has IIJ flag
 */
function hasIIJ(plan: Plan): boolean {
  const nameUpper = (plan.name || '').toUpperCase();
  return nameUpper.includes('(IIJ)') || nameUpper.includes('IIJ');
}

/**
 * Deduplicate plans: if multiple plans have the same location, duration, and data size,
 * - For Japan: prefer the one with "(IIJ)" in the name
 * - For all other countries: prefer the one with "nonhkip" flag
 * If no preferred version exists, keep the first one.
 * 
 * @param plans - Array of plans to deduplicate
 * @returns Deduplicated array of plans
 */
export function deduplicatePlans(plans: Plan[]): Plan[] {
  // Create a map keyed by location, duration, and data size
  const planMap = new Map<string, Plan[]>();
  
  for (const plan of plans) {
    // Normalize location (handle multi-country plans)
    const location = (plan.location || '').split(',')[0].trim().toUpperCase();
    
    // Create a key: location_duration_durationUnit_volume
    const key = `${location}_${plan.duration}_${plan.durationUnit || 'day'}_${plan.volume}`;
    
    if (!planMap.has(key)) {
      planMap.set(key, []);
    }
    planMap.get(key)!.push(plan);
  }
  
  // For each group, prefer IIJ for Japan, nonhkip for others
  const deduplicated: Plan[] = [];
  
  // Convert Map entries to array for iteration compatibility
  const entries = Array.from(planMap.entries());
  
  for (let i = 0; i < entries.length; i++) {
    const [key, group] = entries[i];
    
    if (group.length === 1) {
      // Only one plan, keep it
      deduplicated.push(group[0]);
    } else {
      // Get location from first plan in group (all have same location)
      const location = (group[0].location || '').split(',')[0].trim().toUpperCase();
      const isJapan = location === 'JP' || location === 'JAPAN';
      
      let preferredPlan: Plan | undefined;
      
      if (isJapan) {
        // For Japan: prefer IIJ version
        preferredPlan = group.find(plan => hasIIJ(plan));
      } else {
        // For all other countries: prefer nonhkip version
        preferredPlan = group.find(plan => hasNonHKIP(plan));
      }
      
      if (preferredPlan) {
        deduplicated.push(preferredPlan);
      } else {
        // No preferred version, keep the first one
        deduplicated.push(group[0]);
      }
    }
  }
  
  return deduplicated;
}

