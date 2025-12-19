/**
 * Hook to fetch plan summary data (lowest price and plan count) for countries
 * Uses memoization and batching to optimize API calls
 */

import { useState, useEffect, useMemo } from "react";
import { safeFetch } from "@/lib/safe-fetch";
import { Plan } from "@/components/PlanCard";
import { filterVisiblePlans, calculateGB, getFinalPriceUSD } from "@/lib/plan-utils";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";

export interface CountryPlanSummary {
  countryCode: string;
  lowestPriceUSD: number;
  planCount: number;
  loading: boolean;
}

interface PlanSummaryCache {
  [countryCode: string]: {
    lowestPriceUSD: number;
    planCount: number;
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: PlanSummaryCache = {};

/**
 * Fetch plan summary for a single country
 */
async function fetchCountryPlanSummary(
  countryCode: string,
  apiUrl: string
): Promise<{ lowestPriceUSD: number; planCount: number }> {
  // Check cache first
  const cached = cache[countryCode];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      lowestPriceUSD: cached.lowestPriceUSD,
      planCount: cached.planCount,
    };
  }

  try {
    // Fetch plans for this country
    const plans = await safeFetch<Plan[]>(
      `${apiUrl}/countries/${countryCode}/plans`,
      { showToast: false }
    );

    // Filter to visible plans (same logic as country page)
    const visiblePlans = filterVisiblePlans(plans || []);

    // Filter to only country-specific plans (exclude multi-country plans)
    const countrySpecificPlans = visiblePlans.filter((plan: Plan) => {
      return (
        plan.location &&
        !plan.location.includes(",") &&
        plan.location.trim().toUpperCase() === countryCode.toUpperCase()
      );
    });

    // Calculate lowest price (with discounts applied)
    let lowestPriceUSD = 0;
    if (countrySpecificPlans.length > 0) {
      // Fetch discounts if not already loaded
      await fetchDiscounts();

      lowestPriceUSD = Math.min(
        ...countrySpecificPlans.map((plan) => {
          const gb = calculateGB(plan.volume);
          const discount = getDiscount(plan.packageCode, gb);
          return getFinalPriceUSD(plan, discount);
        })
      );
    }

    const summary = {
      lowestPriceUSD,
      planCount: countrySpecificPlans.length,
    };

    // Cache the result
    cache[countryCode] = {
      ...summary,
      timestamp: Date.now(),
    };

    return summary;
  } catch (error) {
    console.error(`Failed to fetch plan summary for ${countryCode}:`, error);
    return { lowestPriceUSD: 0, planCount: 0 };
  }
}

/**
 * Hook to get plan summaries for multiple countries
 * Fetches data in batches to avoid overwhelming the API
 */
export function useCountryPlanSummaries(
  countryCodes: string[],
  options: { enabled?: boolean; batchSize?: number } = {}
) {
  const { enabled = true, batchSize = 10 } = options;
  const [summaries, setSummaries] = useState<Record<string, CountryPlanSummary>>({});
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (!enabled || countryCodes.length === 0) {
      setLoading(false);
      return;
    }

    // Initialize summaries with loading state
    const initialSummaries: Record<string, CountryPlanSummary> = {};
    countryCodes.forEach((code) => {
      initialSummaries[code] = {
        countryCode: code,
        lowestPriceUSD: 0,
        planCount: 0,
        loading: true,
      };
    });
    setSummaries(initialSummaries);
    setLoading(true);

    // Fetch summaries in batches
    const fetchBatch = async (batch: string[], batchIndex: number) => {
      // Add delay between batches to avoid rate limiting
      if (batchIndex > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100 * batchIndex));
      }

      const promises = batch.map(async (code) => {
        try {
          const summary = await fetchCountryPlanSummary(code, apiUrl);
          return { code, summary, success: true };
        } catch (error) {
          return { code, summary: { lowestPriceUSD: 0, planCount: 0 }, success: false };
        }
      });

      const results = await Promise.all(promises);

      setSummaries((prev) => {
        const updated = { ...prev };
        results.forEach((result) => {
          updated[result.code] = {
            countryCode: result.code,
            ...result.summary,
            loading: false,
          };
        });
        return updated;
      });
    };

    // Process in batches sequentially
    const batches: string[][] = [];
    for (let i = 0; i < countryCodes.length; i += batchSize) {
      batches.push(countryCodes.slice(i, i + batchSize));
    }

    // Process batches sequentially
    (async () => {
      for (let i = 0; i < batches.length; i++) {
        await fetchBatch(batches[i], i);
      }
      setLoading(false);
    })();
  }, [countryCodes.join(","), enabled, batchSize, apiUrl]);

  return { summaries, loading };
}

/**
 * Hook to get plan summary for a single country
 */
export function useCountryPlanSummary(countryCode: string | null) {
  const codes = useMemo(() => (countryCode ? [countryCode] : []), [countryCode]);
  const { summaries, loading } = useCountryPlanSummaries(codes);

  return {
    summary: countryCode ? summaries[countryCode] : null,
    loading,
  };
}

