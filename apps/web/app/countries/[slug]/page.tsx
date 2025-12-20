"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, GitCompare } from "lucide-react";
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
import { PlanComparison } from "@/components/PlanComparison";

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
  const [sortBy, setSortBy] = useState<"days" | "price" | "dataSize" | "name">("price");
  const [currentPage, setCurrentPage] = useState(1);
  const plansPerPage = 12;
  const [comparisonPlans, setComparisonPlans] = useState<Plan[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
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
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Backend still uses country code
        const data = await safeFetch<Plan[]>(`${apiUrl}/countries/${countryCode}/plans`, { showToast: false });
        
        // Check if this is a valid country code (2 letters) vs a region/plan code (like "as-12")
        const isValidCountryCode = /^[A-Z]{2}$/.test(countryCode);
        
        // Filter plans based on whether this is a single country page or a multi-region plan page
        let filteredPlans: Plan[];
        if (isValidCountryCode) {
          // For actual country pages: only show country-specific plans (exclude multi-country/regional plans)
          // Multi-country plans have comma-separated location codes, single-country plans match exactly
          filteredPlans = (data || []).filter((plan: Plan) => {
            // Only include plans where location exactly matches the country code (single country)
            // Exclude plans with commas (multi-country regions)
            return plan.location && !plan.location.includes(',') && plan.location.trim().toUpperCase() === countryCode.toUpperCase();
          });
        } else {
          // For region/plan codes (like "as-12"): show all plans including multi-region ones
          // The backend should already filter by the region code, so we just return all plans
          filteredPlans = data || [];
        }
        
        setPlans(filteredPlans);
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
  
  // Apply sort
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = [...visiblePlans];
    
    // Apply sort
      switch (sortBy) {
        case "days":
          filtered.sort((a, b) => {
            const aDuration = a.duration || 0;
            const bDuration = b.duration || 0;
            return aDuration - bDuration;
          });
          break;
        case "price":
          filtered.sort((a, b) => {
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
          filtered.sort((a, b) => {
            const aGB = calculateGB(a.volume);
            const bGB = calculateGB(b.volume);
            return aGB - bGB;
          });
          break;
        case "name":
          filtered.sort((a, b) => {
            const aName = a.name || "";
            const bName = b.name || "";
            return aName.localeCompare(bName);
          });
          break;
    }
    
    return filtered;
  }, [visiblePlans, sortBy]);
  
  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPlans.length / plansPerPage);
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * plansPerPage;
    return filteredAndSortedPlans.slice(start, start + plansPerPage);
  }, [filteredAndSortedPlans, currentPage, plansPerPage]);
  
  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  // Construct flag URL
  const flagUrl = `https://flagcdn.com/w320/${countryCode.toLowerCase().split('-')[0]}.png`;

  // Calculate lowest price from the actual plans that will be displayed
  // This ensures the price matches what users will see
  const lowestPriceUSD = filteredAndSortedPlans.length > 0
    ? Math.min(...filteredAndSortedPlans.map(p => {
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
        ) : paginatedPlans.length === 0 ? (
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
            {/* Sort Filter and Comparison */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-[var(--voyage-muted)]">
                {filteredAndSortedPlans.length} plan{filteredAndSortedPlans.length !== 1 ? 's' : ''} available
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="flex items-center gap-3">
                {comparisonPlans.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComparison(true)}
                    className="border-[var(--voyage-accent)] bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)] hover:text-white"
                  >
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare ({comparisonPlans.length})
                  </Button>
                )}
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
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPlans.map((plan) => (
                <div key={plan.packageCode} className="relative">
                  <PlanCard plan={plan} />
                  <button
                    onClick={() => {
                      if (comparisonPlans.some(p => p.packageCode === plan.packageCode)) {
                        setComparisonPlans(prev => prev.filter(p => p.packageCode !== plan.packageCode));
                      } else if (comparisonPlans.length < 4) {
                        setComparisonPlans(prev => [...prev, plan]);
                      }
                    }}
                    className={`absolute top-6 right-[120px] z-10 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      comparisonPlans.some(p => p.packageCode === plan.packageCode)
                        ? "bg-[var(--voyage-accent)] text-white"
                        : "bg-[var(--voyage-bg-light)] text-[var(--voyage-muted)] hover:bg-[var(--voyage-accent)]/20 hover:text-[var(--voyage-accent)]"
                    }`}
                    title={
                      comparisonPlans.some(p => p.packageCode === plan.packageCode)
                        ? "Remove from comparison"
                        : comparisonPlans.length >= 4
                        ? "Maximum 4 plans can be compared"
                        : "Add to comparison"
                    }
                  >
                    <GitCompare className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[var(--voyage-border)] bg-[var(--voyage-card)] text-white hover:bg-[var(--voyage-bg-light)] disabled:opacity-50"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? "bg-[var(--voyage-accent)] text-white"
                            : "bg-[var(--voyage-card)] border border-[var(--voyage-border)] text-[var(--voyage-text)] hover:border-[var(--voyage-accent)]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[var(--voyage-border)] bg-[var(--voyage-card)] text-white hover:bg-[var(--voyage-bg-light)] disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Plan Comparison Modal */}
      {showComparison && (
        <PlanComparison
          plans={comparisonPlans}
          onClose={() => setShowComparison(false)}
          onRemove={(packageCode) => {
            setComparisonPlans(prev => prev.filter(p => p.packageCode !== packageCode));
          }}
        />
      )}
    </div>
  );
}

