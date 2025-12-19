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
      <div className="h-full group bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-5 shadow-sm hover:shadow-xl hover:bg-[var(--voyage-card-hover)] hover:border-[var(--voyage-accent)]/30 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-4 flex-1">
            <FlagIcon logoUrl={country.locationLogo} alt={country.name} className="h-8 w-11 rounded-md border-2 border-[var(--voyage-border)] shadow-sm flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-lg text-[var(--voyage-text)] group-hover:text-white transition-colors block">
                {country.name}
              </span>
            </div>
          </div>
          
          <div className="bg-[var(--voyage-bg-light)] p-2 rounded-full group-hover:bg-[var(--voyage-accent)] transition-colors z-10 flex-shrink-0 ml-2">
            <ChevronRight className="h-4 w-4 text-[var(--voyage-muted)] group-hover:text-white" />
          </div>
        </div>

        {/* Plan Summary Info */}
        <div className="mt-4 pt-4 border-t border-[var(--voyage-border)]/50 space-y-1.5">
          {loadingSummary ? (
            <div className="space-y-1.5">
              <div className="h-4 bg-[var(--voyage-bg-light)] rounded animate-pulse" />
              <div className="h-3 bg-[var(--voyage-bg-light)] rounded animate-pulse w-2/3" />
            </div>
          ) : (
            <>
              {lowestPriceUSD > 0 && (
                <div className="text-sm font-semibold text-[var(--voyage-accent)]">
                  From {formatCurrency(convertedPrice)}
                </div>
              )}
              {planCount > 0 && (
                <div className="text-xs text-[var(--voyage-muted)]">
                  {planCount} plan{planCount !== 1 ? 's' : ''} available
                </div>
              )}
              {lowestPriceUSD === 0 && planCount === 0 && (
                <div className="text-xs text-[var(--voyage-muted)]">
                  No plans available
                </div>
              )}
            </>
          )}
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--voyage-accent)]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      </div>
    </Link>
  );
}

