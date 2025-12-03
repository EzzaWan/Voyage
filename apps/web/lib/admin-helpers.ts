// Helper functions for admin panel

// Human-readable order status mapping
export function getOrderStatusDisplay(status: string): { label: string; className: string } {
  const statusLower = status.toLowerCase();
  
  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400" },
    payment_pending: { label: "Payment Pending", className: "bg-yellow-500/20 text-yellow-400" },
    paid: { label: "Paid", className: "bg-blue-500/20 text-blue-400" },
    provisioning: { label: "Provisioning", className: "bg-blue-500/20 text-blue-400" },
    esim_created: { label: "eSIM Created", className: "bg-green-500/20 text-green-400" },
    active: { label: "Active", className: "bg-green-500/20 text-green-400" },
    completed: { label: "Completed", className: "bg-green-500/20 text-green-400" },
    failed: { label: "Failed", className: "bg-red-500/20 text-red-400" },
    cancelled: { label: "Cancelled", className: "bg-gray-500/20 text-gray-400" },
    canceled: { label: "Cancelled", className: "bg-gray-500/20 text-gray-400" },
    esim_pending: { label: "eSIM Pending", className: "bg-yellow-500/20 text-yellow-400" },
    esim_order_failed: { label: "eSIM Order Failed", className: "bg-red-500/20 text-red-400" },
    esim_no_orderno: { label: "eSIM Pending", className: "bg-yellow-500/20 text-yellow-400" },
  };
  
  return statusMap[statusLower] || { label: status, className: "bg-gray-500/20 text-gray-400" };
}

// Human-readable eSIM status mapping
export function getEsimStatusDisplay(status: string | undefined): { label: string; className: string } {
  if (!status) return { label: "Unknown", className: "bg-gray-500/20 text-gray-400" };
  
  const statusUpper = status.toUpperCase();
  
  const statusMap: Record<string, { label: string; className: string }> = {
    GOT_RESOURCE: { label: "Ready", className: "bg-green-500/20 text-green-400" },
    IN_USE: { label: "Active", className: "bg-blue-500/20 text-blue-400" },
    EXPIRED: { label: "Expired", className: "bg-red-500/20 text-red-400" },
    SUSPENDED: { label: "Suspended", className: "bg-yellow-500/20 text-yellow-400" },
    RELEASED: { label: "Released", className: "bg-blue-500/20 text-blue-400" },
  };
  
  return statusMap[statusUpper] || { label: status, className: "bg-gray-500/20 text-gray-400" };
}

// Human-readable top-up status mapping
export function getTopUpStatusDisplay(status: string): { label: string; className: string } {
  const statusLower = status.toLowerCase();
  
  const statusMap: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400" },
    processing: { label: "Processing", className: "bg-blue-500/20 text-blue-400" },
    completed: { label: "Completed", className: "bg-green-500/20 text-green-400" },
    succeeded: { label: "Succeeded", className: "bg-green-500/20 text-green-400" },
    failed: { label: "Failed", className: "bg-red-500/20 text-red-400" },
  };
  
  return statusMap[statusLower] || { label: status, className: "bg-gray-500/20 text-gray-400" };
}

// Plan name cache to avoid repeated API calls
const planNameCache = new Map<string, { name: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fetch plan name from plan code
export async function getPlanName(planCode: string, apiUrl: string): Promise<string> {
  // Check cache first
  const cached = planNameCache.get(planCode);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.name;
  }
  
  try {
    const res = await fetch(`${apiUrl}/plans/${planCode}`);
    if (res.ok) {
      const plan = await res.json();
      const planName = plan.name || planCode;
      // Cache the result
      planNameCache.set(planCode, { name: planName, timestamp: Date.now() });
      return planName;
    }
  } catch (error) {
    console.error(`Failed to fetch plan name for ${planCode}:`, error);
  }
  
  // Return plan code as fallback
  return planCode;
}

// Batch fetch plan names to reduce API calls
export async function getPlanNames(planCodes: string[], apiUrl: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uncachedCodes: string[] = [];
  
  // Check cache first
  for (const code of planCodes) {
    const cached = planNameCache.get(code);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      result.set(code, cached.name);
    } else {
      uncachedCodes.push(code);
    }
  }
  
  // Fetch uncached plans
  const fetchPromises = uncachedCodes.map(async (code) => {
    try {
      const res = await fetch(`${apiUrl}/plans/${code}`);
      if (res.ok) {
        const plan = await res.json();
        const planName = plan.name || code;
        planNameCache.set(code, { name: planName, timestamp: Date.now() });
        result.set(code, planName);
      } else {
        result.set(code, code); // Fallback to code
      }
    } catch (error) {
      console.error(`Failed to fetch plan name for ${code}:`, error);
      result.set(code, code); // Fallback to code
    }
  });
  
  await Promise.all(fetchPromises);
  return result;
}

