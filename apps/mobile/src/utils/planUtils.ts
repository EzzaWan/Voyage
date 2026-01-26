/**
 * Plan utility functions for mobile app
 * Mirrors the web app's plan-utils.ts for consistency
 */

export interface Plan {
  packageCode?: string;
  id?: string;
  name: string;
  price: number;
  volume?: number; // in MB from API, but we'll handle bytes too
  duration?: number;
  durationUnit?: string;
  description?: string;
  location?: string;
  locationNetworkList?: { locationCode: string }[];
  currencyCode?: string;
}

// GB sizes we don't sell - filter these out
const EXCLUDED_GB_SIZES = [0.5, 1.5, 2.0];
const MIN_GB_SIZE = 1.5; // Minimum GB size allowed (exclusive, so > 1.5GB)
const MIN_PRICE_USD = 3.0; // Minimum price to show

/**
 * Calculate GB from volume
 * Handles both MB (from API) and bytes formats
 */
export function calculateGB(volume?: number): number {
  if (!volume || volume <= 0) return 0;
  
  // If volume is very large (> 1000000), assume it's in bytes
  // Otherwise assume it's in MB (which is what the API returns)
  if (volume > 1000000) {
    // Bytes to GB
    return volume / 1024 / 1024 / 1024;
  } else {
    // MB to GB
    return volume / 1024;
  }
}

/**
 * Format data size for display
 */
export function formatDataSize(volume?: number): string {
  if (!volume || volume <= 0) return '—';
  
  const gb = calculateGB(volume);
  
  if (gb >= 1) {
    // Show as GB
    return gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
  } else {
    // Show as MB
    const mb = volume > 1000000 ? volume / 1024 / 1024 : volume;
    return `${Math.round(mb)} MB`;
  }
}

/**
 * Format validity/duration for display
 */
export function formatValidity(duration?: number, durationUnit?: string): string {
  if (!duration) return '—';
  const unit = durationUnit?.toLowerCase() === 'month' ? 'Month' : 'Day';
  return `${duration} ${unit}${duration !== 1 ? 's' : ''}`;
}

/**
 * Check if a GB size should be excluded
 */
function isExcludedGBSize(gb: number): boolean {
  const rounded = Math.round(gb * 10) / 10; // Round to 1 decimal
  return EXCLUDED_GB_SIZES.includes(rounded);
}

/**
 * Check if plan is a daily unlimited plan (2GB + FUP1Mbps)
 */
export function isDailyUnlimitedPlan(plan: Plan): boolean {
  // Must have volume (not truly unlimited -1)
  if (!plan.volume || plan.volume === -1) {
    return false;
  }
  
  const volumeGB = calculateGB(plan.volume);
  
  // Check if it's exactly 2GB (allow small tolerance for rounding)
  if (volumeGB < 1.95 || volumeGB > 2.05) {
    return false;
  }
  
  // Must have FUP1Mbps flag - use robust detection
  const nameLower = (plan.name || '').toLowerCase();
  
  // Check name for explicit FUP patterns
  const fupPattern = /\bfup(\d+)?mbps?\b/i;
  const fupStandalone = /\bfup\b/i;
  const fupInName = nameLower.match(fupPattern) || nameLower.match(fupStandalone);
  
  // Check for common variations in name
  const hasFUP1Mbps = fupInName || 
                     nameLower.includes('fup1mbps') || 
                     nameLower.includes('fup 1mbps') ||
                     nameLower.includes('fup 1 mbps');
  
  if (hasFUP1Mbps) {
    // Check if speed limit is 1Mbps (or default to 1 if not specified)
    const speedMatch = nameLower.match(/fup(\d+)?mbps?/i);
    const speedLimit = speedMatch 
      ? parseInt(speedMatch[1] || '1')
      : 1;
    
    // Only return true if speed limit is 1Mbps
    return speedLimit === 1;
  }
  
  return false;
}

/**
 * Check if plan should be visible (>= $3 USD)
 * Exception: 1GB 7 days plans are always visible regardless of price
 * Note: This function is called after filterVisiblePlans already handles 1GB 7 days,
 * but kept here for consistency and as a safety check
 */
export function isPlanVisible(plan: Plan, discountPercent: number = 0): boolean {
  // Always show 1GB 7 days plans regardless of price
  if (is1GB7DaysPlan(plan)) {
    return true;
  }
  
  const finalPrice = discountPercent > 0
    ? plan.price * (1 - discountPercent / 100)
    : plan.price;
  return finalPrice >= MIN_PRICE_USD;
}

/**
 * Check if a plan has nonhkip flag
 */
function hasNonHKIP(plan: Plan): boolean {
  const nameLower = (plan.name || '').toLowerCase();
  return nameLower.includes('nonhkip') || nameLower.includes('nonhk');
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
 * Filter plans to only country-specific ones (exclude multi-country/regional)
 */
export function filterCountrySpecificPlans(plans: Plan[], countryCode: string): Plan[] {
  const upperCode = countryCode.toUpperCase();
  
  return plans.filter(plan => {
    // Only include plans where location exactly matches the country code (single country)
    // Exclude plans with commas (multi-country regions)
    const location = plan.location?.trim().toUpperCase() || '';
    return location && !location.includes(',') && location === upperCode;
  });
}

/**
 * Filter plans to only visible ones
 * - >= $3 USD (except 1GB 7 days plans which bypass price filter)
 * - Exclude 0.5GB, 1.5GB, 2GB (except unlimited and 1GB 7 days)
 * - Exclude plans <= 1.5GB (except unlimited and 1GB 7 days)
 * - Exclude 1-day plans (except unlimited)
 * - 1GB 7 days plans are always included (excluding FUP and nonhkip variants)
 */
export function filterVisiblePlans(plans: Plan[], getDiscount?: (packageCode: string, gb: number) => number): Plan[] {
  return plans.filter((plan) => {
    // TEMPORARY: Bypass all filters for Malaysia test plan PJJ7HCK42
    if (plan.packageCode === 'PJJ7HCK42') {
      return true;
    }
    
    const gb = calculateGB(plan.volume);
    const isUnlimited = isDailyUnlimitedPlan(plan);
    const is1GB7Days = is1GB7DaysPlan(plan);
    
    // Always include 1GB 7 days plans (they bypass all filters except FUP/nonhkip check)
    if (is1GB7Days) {
      return true;
    }
    
    // Exclude all plans <= 1.5GB (except unlimited plans)
    if (gb <= MIN_GB_SIZE && !isUnlimited) {
      return false;
    }
    
    // Exclude specific GB sizes (except unlimited plans)
    if (isExcludedGBSize(gb) && !isUnlimited) {
      return false;
    }
    
    // Exclude all 1-day plans (except unlimited plans)
    const duration = plan.duration || 0;
    const durationUnit = (plan.durationUnit || 'day').toLowerCase();
    const isOneDay = duration === 1 && durationUnit === 'day';
    
    if (isOneDay && !isUnlimited) {
      return false;
    }
    
    // Filter by price (>= $3 USD)
    // Note: 1GB 7 days plans already returned true above, so they bypass this
    const discountPercent = getDiscount ? getDiscount(plan.packageCode || '', gb) : 0;
    return isPlanVisible(plan, discountPercent);
  });
}

/**
 * Get the lowest price from filtered plans (plans we actually sell)
 * Used to display "from $X" pricing on country cards
 */
export function getLowestPriceFromPlans(plans: Plan[]): number | undefined {
  const visiblePlans = filterVisiblePlans(plans);
  
  if (visiblePlans.length === 0) {
    return undefined;
  }
  
  const prices = visiblePlans.map(p => p.price).filter(p => p > 0);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

/**
 * Deduplicate plans: if multiple plans have same location, duration, and data size,
 * - For Japan: prefer the one with "(IIJ)" in the name
 * - For all other countries: prefer the one with "nonhkip" flag
 */
export function deduplicatePlans(plans: Plan[]): Plan[] {
  // Create a map keyed by location, duration, and data size
  const planMap = new Map<string, Plan[]>();
  
  for (const plan of plans) {
    // Normalize location
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
  
  const entries = Array.from(planMap.entries());
  
  for (const [key, group] of entries) {
    if (group.length === 1) {
      deduplicated.push(group[0]);
    } else {
      // Get location from first plan in group
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

/**
 * Sort plans by different criteria
 */
export type SortOption = 'price' | 'duration' | 'dataSize' | 'name';

export function sortPlans(plans: Plan[], sortBy: SortOption, getDiscount?: (packageCode: string, gb: number) => number): Plan[] {
  const sorted = [...plans];
  
  switch (sortBy) {
    case 'duration':
      sorted.sort((a, b) => {
        const aDuration = a.duration || 0;
        const bDuration = b.duration || 0;
        // Normalize to days for comparison
        const aUnit = (a.durationUnit || 'day').toLowerCase();
        const bUnit = (b.durationUnit || 'day').toLowerCase();
        const aDays = aUnit === 'month' ? aDuration * 30 : aDuration;
        const bDays = bUnit === 'month' ? bDuration * 30 : bDuration;
        return aDays - bDays;
      });
      break;
      
    case 'price':
      sorted.sort((a, b) => {
        const aGB = calculateGB(a.volume);
        const bGB = calculateGB(b.volume);
        const aDiscount = getDiscount ? getDiscount(a.packageCode || '', aGB) : 0;
        const bDiscount = getDiscount ? getDiscount(b.packageCode || '', bGB) : 0;
        const aPrice = a.price * (1 - aDiscount / 100);
        const bPrice = b.price * (1 - bDiscount / 100);
        return aPrice - bPrice;
      });
      break;
      
    case 'dataSize':
      sorted.sort((a, b) => {
        const aGB = calculateGB(a.volume);
        const bGB = calculateGB(b.volume);
        return aGB - bGB;
      });
      break;
      
    case 'name':
      sorted.sort((a, b) => {
        const aName = a.name || '';
        const bName = b.name || '';
        return aName.localeCompare(bName);
      });
      break;
  }
  
  return sorted;
}

/**
 * Separate plans into Standard and Unlimited categories
 */
export function separatePlansByType(plans: Plan[]): { standard: Plan[]; unlimited: Plan[] } {
  const standard: Plan[] = [];
  const unlimited: Plan[] = [];
  
  for (const plan of plans) {
    if (isDailyUnlimitedPlan(plan)) {
      unlimited.push(plan);
    } else {
      standard.push(plan);
    }
  }
  
  return { standard, unlimited };
}

/**
 * Get display name for a plan (with Unlimited replacement for FUP plans)
 */
export function getDisplayName(plan: Plan): string {
  let displayName = plan.name || 'Unknown Plan';
  
  if (isDailyUnlimitedPlan(plan)) {
    displayName = displayName
      .replace(/\b2gb\b/gi, 'Unlimited')
      .replace(/\b2\s*gb\b/gi, 'Unlimited')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return displayName;
}

/**
 * Get display data size for a plan
 */
export function getDisplayDataSize(plan: Plan): string {
  if (isDailyUnlimitedPlan(plan)) {
    return 'Unlimited';
  }
  return formatDataSize(plan.volume);
}

/**
 * Calculate final price with optional discount
 */
export function calculateFinalPrice(basePrice: number, discountPercent: number = 0): number {
  if (discountPercent <= 0) return basePrice;
  return Math.max(0, basePrice * (1 - discountPercent / 100));
}

/**
 * Process plans through the full pipeline (filter, deduplicate, separate)
 */
export function processPlansForDisplay(
  plans: Plan[], 
  countryCode: string,
  getDiscount?: (packageCode: string, gb: number) => number
): { standard: Plan[]; unlimited: Plan[]; total: number } {
  // Check if this is a global plan code (GL-120, GL-139) or a regular country code
  const isGlobalPlan = countryCode.startsWith('GL-');
  const isValidCountryCode = /^[A-Z]{2}$/.test(countryCode);
  
  let filteredPlans: Plan[];
  
  if (isGlobalPlan) {
    // For global plans: show all plans returned by the API
    // The backend already filters plans for GL-120/GL-139, so we keep all of them
    // No need to filter by location since backend handles it
    filteredPlans = plans;
  } else if (isValidCountryCode) {
    // For regular country codes: filter to country-specific plans only (exclude multi-country)
    filteredPlans = filterCountrySpecificPlans(plans, countryCode);
  } else {
    // For region codes or other: show all plans (backend should already filter)
    filteredPlans = plans;
  }
  
  // 2. Filter visible plans (price, data size, duration rules)
  const visiblePlans = filterVisiblePlans(filteredPlans, getDiscount);
  
  // 3. Deduplicate (prefer IIJ for Japan, nonhkip for others)
  const deduplicatedPlans = deduplicatePlans(visiblePlans);
  
  // 4. Separate into Standard and Unlimited
  const { standard, unlimited } = separatePlansByType(deduplicatedPlans);
  
  return {
    standard,
    unlimited,
    total: standard.length + unlimited.length,
  };
}




