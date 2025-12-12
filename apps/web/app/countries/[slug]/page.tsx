"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/FlagIcon";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { safeFetch } from "@/lib/safe-fetch";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { getCodeFromSlug, getCountryName, getSlugFromCode } from "@/lib/country-slugs";
import {
  filterVisiblePlans,
  calculateGB,
  getFinalPriceUSD,
} from "@/lib/plan-utils";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";

export default function CountryPlansPageSlug({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const router = useRouter();
  
  // Check if slug is actually a country code (2 uppercase letters)
  const isCode = /^[A-Z]{2}$/i.test(slug);
  
  // Get country code from slug (for API call)
  const countryCode = isCode ? slug.toUpperCase() : (getCodeFromSlug(slug) || slug.toUpperCase());
  const countryName = getCountryName(slug);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(isCode);
  const [sortBy, setSortBy] = useState<"days" | "price" | "dataSize" | "name">("days");
  
  const { rates, convert, formatCurrency } = useCurrency();
  
  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  // If it's a code, redirect to slug-based URL
  useEffect(() => {
    if (isCode) {
      const properSlug = getSlugFromCode(slug.toUpperCase()) || slug.toLowerCase();
      if (properSlug !== slug.toLowerCase()) {
        router.replace(`/countries/${properSlug}`);
      } else {
        setRedirecting(false);
      }
    } else {
      setRedirecting(false);
    }
  }, [slug, isCode, router]);
  
  // Handle redirect if code detected
  useEffect(() => {
    if (isCode) {
      const properSlug = getSlugFromCode(slug.toUpperCase()) || slug.toLowerCase();
      if (properSlug !== slug.toLowerCase()) {
        router.replace(`/countries/${properSlug}`);
      } else {
        setRedirecting(false);
      }
    }
  }, [slug, isCode, router]);
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Backend still uses country code
        const data = await safeFetch<Plan[]>(`${apiUrl}/countries/${countryCode}/plans`, { showToast: false });
        setPlans(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [countryCode, apiUrl]);

  // Filter plans to only visible ones (>= $3 USD and exclude 0.5GB/1.5GB/2GB)
  const visiblePlans = filterVisiblePlans(plans);
  
  // Sort plans based on selected sort option
  const sortedPlans = useMemo(() => {
    const sorted = [...visiblePlans];
    
    switch (sortBy) {
      case "days":
        // Sort by duration (days) ascending
        sorted.sort((a, b) => {
          const aDuration = a.duration || 0;
          const bDuration = b.duration || 0;
          return aDuration - bDuration;
        });
        break;
      case "price":
        // Sort by price (USD) ascending
        sorted.sort((a, b) => {
          const aGB = calculateGB(a.volume);
          const bGB = calculateGB(b.volume);
          const aDiscount = getDiscount(a.packageCode, aGB);
          const bDiscount = getDiscount(b.packageCode, bGB);
          const aPrice = getFinalPriceUSD(a, aDiscount);
          const bPrice = getFinalPriceUSD(b, bDiscount);
          return aPrice - bPrice;
        });
        break;
      case "dataSize":
        // Sort by data size (GB) ascending
        sorted.sort((a, b) => {
          const aGB = calculateGB(a.volume);
          const bGB = calculateGB(b.volume);
          return aGB - bGB;
        });
        break;
      case "name":
        // Sort by plan name alphabetically
        sorted.sort((a, b) => {
          const aName = a.name || "";
          const bName = b.name || "";
          return aName.localeCompare(bName);
        });
        break;
    }
    
    return sorted;
  }, [visiblePlans, sortBy]);

  // Construct flag URL
  const flagUrl = `https://flagcdn.com/w320/${countryCode.toLowerCase().split('-')[0]}.png`;

  // Calculate lowest price from the actual plans that will be displayed
  // This ensures the price matches what users will see
  const lowestPriceUSD = sortedPlans.length > 0
    ? Math.min(...sortedPlans.map(p => {
        const planGB = calculateGB(p.volume);
        const discountPercent = getDiscount(p.packageCode, planGB);
        return getFinalPriceUSD(p, discountPercent);
      }))
    : 0;
  
  // Convert to user's selected currency for display
  const lowestPriceConverted = convert(lowestPriceUSD);

  return (
    <div className="space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-[var(--voyage-muted)] hover:text-white hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
          </Button>
        </Link>
      </div>

      {/* Region Header */}
      <div className="relative bg-gradient-to-r from-[var(--voyage-accent)]/20 to-purple-500/20 rounded-3xl p-8 md:p-12 border border-[var(--voyage-border)] overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[var(--voyage-accent)]/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="h-24 w-32 md:h-32 md:w-44 rounded-xl bg-white p-1 shadow-2xl shadow-[var(--voyage-accent)]/30">
            <div className="h-full w-full rounded-lg overflow-hidden bg-gray-100 relative">
              <FlagIcon logoUrl={flagUrl} alt={countryCode} className="h-full w-full border-none rounded-none object-cover" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {countryName} eSIM
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--voyage-muted)]">
              <MapPin className="h-4 w-4" />
              <span>Popular destination</span>
            </div>
            {lowestPriceUSD > 0 && (
              <div className="inline-block mt-2 px-4 py-1 rounded-full bg-[var(--voyage-accent)] text-white font-bold text-sm shadow-lg shadow-[var(--voyage-accent)]/30">
                Plans starting from {formatCurrency(lowestPriceConverted)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans Display */}
      <div className="space-y-6">
        {redirecting ? (
          <div className="text-center py-20 text-[var(--voyage-muted)]">Redirecting...</div>
        ) : loading ? (
          <div className="text-center py-20 text-[var(--voyage-muted)]">Loading plans...</div>
        ) : sortedPlans.length === 0 ? (
          <EmptyState
            title="No plans available"
            description={`No eSIM plans are currently available for ${countryName}. Please check back later or browse other countries.`}
            icon={Package}
            action={{
              label: "Browse All Countries",
              onClick: () => window.location.href = "/"
            }}
          />
        ) : (
          <>
            {/* Sort Filter */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--voyage-muted)]">
                {sortedPlans.length} plan{sortedPlans.length !== 1 ? 's' : ''} available
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--voyage-muted)]">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "days" | "price" | "dataSize" | "name")}
                  className="px-3 py-1.5 rounded-lg bg-[var(--voyage-card)] border border-[var(--voyage-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--voyage-accent)]"
                >
                  <option value="days">Duration (Days)</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="dataSize">Data Size</option>
                  <option value="name">Plan Name</option>
                </select>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPlans.map((plan) => (
                <PlanCard key={plan.packageCode} plan={plan} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

