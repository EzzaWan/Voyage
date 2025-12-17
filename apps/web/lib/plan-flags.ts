/**
 * Utility functions to transform provider flags into human-readable labels
 * FRONTEND ONLY - No backend modifications
 */

export interface PlanFlagInfo {
  ipType?: {
    label: string;
    value: string;
  };
  fup?: {
    label: string;
    speedLimit?: string;
    description: string;
  };
  cleanedName: string;
  rawFlags: string[];
}

/**
 * Extract flags from plan name and other fields
 * Flags like "nonhkip" or "FUP1Mbps" may appear in the plan name or as separate fields
 */
export function extractPlanFlags(plan: any): PlanFlagInfo {
  const rawFlags: string[] = [];
  const originalName = plan.name || '';
  let cleanedName = originalName;
  
  const nameLower = cleanedName.toLowerCase();
  
  // Extract IP type flag (nonhkip)
  // Check both in name and in the plan object itself - be explicit
  let ipType: { label: string; value: string } | undefined;
  const hasNonHKIP = nameLower.includes('nonhkip') || 
                     nameLower.includes('nonhk') ||
                     plan.nonhkip === true ||
                     plan.ipType === 'nonhkip' ||
                     (typeof plan.nonhkip === 'string' && plan.nonhkip.toLowerCase() === 'nonhkip');
  
  if (hasNonHKIP) {
    rawFlags.push('nonhkip');
    ipType = {
      label: 'IP Location: Non-Hong Kong',
      value: 'nonhkip',
    };
    // Remove from name if present (handle variations)
    cleanedName = cleanedName.replace(/nonhkip/gi, '').trim();
    cleanedName = cleanedName.replace(/nonhk/gi, '').trim();
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  }
  
  // Extract FUP flag (FUP1Mbps, FUP, etc.)
  // Only match exact FUP patterns - be VERY strict to avoid false positives
  let fup: { label: string; speedLimit?: string; description: string } | undefined;
  
  // Check name for explicit FUP patterns (FUP followed by optional number and Mbps)
  // Use word boundaries to avoid matching "fup" inside other words
  // Use the original name, not cleanedName (which may have been modified by IP type removal)
  const fupPattern = /\bfup(\d+)?mbps?\b/i;
  const fupStandalone = /\bfup\b/i;
  const fupInName = originalName.match(fupPattern) || originalName.match(fupStandalone);
  
  // Check plan object for explicit FUP fields ONLY (be very strict)
  // Only check actual boolean/string fields, not JSON string searches which can match false positives
  const fupInObject = (plan.fup === true) ||
                      (plan.fupSpeed && typeof plan.fupSpeed === 'number') ||
                      (plan.fairUsagePolicy === true) ||
                      (typeof plan.fup === 'string' && /^fup(\d+)?mbps?$/i.test(plan.fup));
  
  // Only add FUP if we have a clear, explicit match
  if (fupInName || fupInObject) {
    // Try to extract speed limit from original name first
    const speedMatch = originalName.match(/fup(\d+)?mbps?/i);
    // If not in name, check plan object
    const speedLimit = speedMatch 
      ? (speedMatch[1] || '1')
      : (plan.fupSpeed ? String(plan.fupSpeed) : '1');
    const flagValue = speedMatch ? `FUP${speedLimit}Mbps` : (plan.fupSpeed ? `FUP${speedLimit}Mbps` : 'FUP');
    
    rawFlags.push(flagValue);
    fup = {
      label: 'Speed reduced after high-speed data usage',
      speedLimit,
      description: `Fair Usage Policy (FUP): After the high-speed data allowance is used, internet speed is reduced to up to ${speedLimit} Mbps. This allows basic browsing, messaging, and maps, but is not suitable for video streaming.`,
    };
    // Remove from name if present (handle variations)
    cleanedName = cleanedName.replace(/fup\d*mbps?/gi, '').trim();
    cleanedName = cleanedName.replace(/\bfup\b/gi, '').trim();
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  }
  
  // Clean up any remaining artifacts: double spaces, trailing separators, parentheses
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  // Remove leading/trailing separators
  cleanedName = cleanedName.replace(/^[,\-_\s]+|[,\-_\s]+$/g, '').trim();
  // Remove empty parentheses pairs and trailing parentheses
  cleanedName = cleanedName.replace(/\s*\(\s*\)/g, '').trim(); // Remove empty ()
  cleanedName = cleanedName.replace(/\s*\(+\s*$/, '').trim(); // Remove trailing (
  cleanedName = cleanedName.replace(/\s*\)+\s*$/, '').trim(); // Remove trailing )
  cleanedName = cleanedName.replace(/\s+$/, '').trim(); // Final trim
  
  return {
    ipType,
    fup,
    cleanedName: cleanedName || plan.name || '', // Fallback to original name if cleaning resulted in empty
    rawFlags,
  };
}

/**
 * Get all display labels for a plan's flags
 */
export function getPlanFlagLabels(plan: any): PlanFlagInfo {
  return extractPlanFlags(plan);
}

/**
 * Check if plan has any flags
 */
export function hasPlanFlags(plan: any): boolean {
  const flags = extractPlanFlags(plan);
  return flags.rawFlags.length > 0;
}

