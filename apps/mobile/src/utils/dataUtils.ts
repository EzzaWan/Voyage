/**
 * Format bytes to human-readable format (GB, MB)
 */
export function formatDataSize(bytes: string | number | null | undefined): string {
  if (!bytes) return '—';
  
  const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(numBytes) || numBytes === 0) return '—';
  
  const gb = numBytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  
  const mb = numBytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

/**
 * Calculate remaining data
 */
export function calculateRemainingData(totalVolume: string | number | null | undefined, orderUsage: string | number | null | undefined): string {
  if (!totalVolume) return '—';
  
  const total = typeof totalVolume === 'string' ? parseFloat(totalVolume) : totalVolume;
  const used = orderUsage ? (typeof orderUsage === 'string' ? parseFloat(orderUsage) : orderUsage) : 0;
  
  if (isNaN(total) || isNaN(used)) return '—';
  
  const remaining = total - used;
  if (remaining < 0) return '0 MB';
  
  return formatDataSize(remaining);
}

/**
 * Calculate data usage percentage (0-100)
 */
export function calculateUsagePercentage(totalVolume: string | number | null | undefined, orderUsage: string | number | null | undefined): number {
  if (!totalVolume) return 0;
  
  const total = typeof totalVolume === 'string' ? parseFloat(totalVolume) : totalVolume;
  const used = orderUsage ? (typeof orderUsage === 'string' ? parseFloat(orderUsage) : orderUsage) : 0;
  
  if (isNaN(total) || isNaN(used) || total === 0) return 0;
  
  const percentage = (used / total) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}

/**
 * Format expiry date or days until expiry
 */
export function formatExpiryDate(expiredTime: string | null | undefined): string {
  if (!expiredTime) return '—';
  
  try {
    const expiryDate = new Date(expiredTime);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires in 1 day';
    } else if (diffDays <= 30) {
      return `Expires in ${diffDays} days`;
    } else {
      // For dates more than 30 days away, show the actual date
      return expiryDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    }
  } catch {
    return expiredTime;
  }
}














