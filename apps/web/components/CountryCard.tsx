"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FlagIcon } from "./FlagIcon";
import { getSlugFromCode } from "@/lib/country-slugs";
import { useCurrency } from "./providers/CurrencyProvider";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

interface CountryCardProps {
  country: Country;
  lowestPriceUSD?: number;
  planCount?: number;
  loadingSummary?: boolean;
}

export function CountryCard({ 
  country, 
  lowestPriceUSD = 0, 
  planCount = 0,
  loadingSummary = false 
}: CountryCardProps) {
  // Use slug-based URL if available, fallback to code
  const slug = getSlugFromCode(country.code) || country.code.toLowerCase();
  const { convert, formatCurrency } = useCurrency();

  // Convert price to selected currency
  const convertedPrice = lowestPriceUSD > 0 ? convert(lowestPriceUSD) : 0;

  return (
    <Link href={`/countries/${slug}`} className="h-full block">
      <div className="h-full group bg-[var(--voyo-card)] border border-[var(--voyo-border)] rounded-xl p-5 shadow-sm hover:shadow-xl hover:bg-[var(--voyo-card-hover)] hover:border-[var(--voyo-accent)]/30 transition-all cursor-pointer flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between z-10 flex-grow">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <FlagIcon logoUrl={country.locationLogo} alt={country.name} className="h-8 w-11 rounded-md border-2 border-[var(--voyo-border)] shadow-sm flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-lg text-[var(--voyo-text)] group-hover:text-white transition-colors block truncate" title={country.name}>
                {country.name}
              </span>
            </div>
          </div>
          
          <div className="bg-[var(--voyo-bg-light)] p-2 rounded-full group-hover:bg-[var(--voyo-accent)] transition-colors z-10 flex-shrink-0 ml-2">
            <ChevronRight className="h-4 w-4 text-[var(--voyo-muted)] group-hover:text-white" />
          </div>
        </div>

        {/* Plan Summary Info - Only show if loading or if we have data to display */}
        {(loadingSummary || lowestPriceUSD > 0 || planCount > 0) && (
          <div className="mt-4 pt-4 border-t border-[var(--voyo-border)]/50 space-y-1.5 z-10">
            {loadingSummary ? (
              <div className="space-y-1.5">
                <div className="h-4 bg-[var(--voyo-bg-light)] rounded animate-pulse" />
                <div className="h-3 bg-[var(--voyo-bg-light)] rounded animate-pulse w-2/3" />
              </div>
            ) : (
              <>
                {lowestPriceUSD > 0 && (
                  <div className="text-sm font-semibold text-[var(--voyo-accent)]">
                    From {formatCurrency(convertedPrice)}
                  </div>
                )}
                {planCount > 0 && (
                  <div className="text-xs text-[var(--voyo-muted)]">
                    {planCount} plan{planCount !== 1 ? 's' : ''} available
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--voyo-accent)]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      </div>
    </Link>
  );
}

