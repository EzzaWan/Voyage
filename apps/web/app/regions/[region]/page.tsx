"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryCard } from "@/components/CountryCard";
import { CountrySkeleton } from "@/components/skeletons";
import { safeFetch } from "@/lib/safe-fetch";
import { getCountriesForRegion, REGION_NAMES, Region } from "@/lib/regions";
import { getCodeFromSlug } from "@/lib/country-slugs";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function RegionPage({ params }: { params: { region: string } }) {
  const regionSlug = params.region as Region;
  const regionName = REGION_NAMES[regionSlug] || regionSlug;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip fetching for global region
    if (regionSlug === "global") {
      setLoading(false);
      return;
    }

    const fetchCountries = async () => {
      try {
        // Get all countries from API
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        
        // Filter to region
        const regionCountryCodes = getCountriesForRegion(regionSlug);
        const regionCountries = countriesArray.filter((country: Country) =>
          regionCountryCodes.includes(country.code.toUpperCase())
        );
        
        // Sort alphabetically
        const sorted = regionCountries.sort((a: Country, b: Country) =>
          a.name.localeCompare(b.name)
        );
        
        setCountries(sorted);
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [regionSlug, apiUrl]);

  return (
    <div className="space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-[var(--voyage-muted)] hover:text-white hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      {/* Region Header */}
      <div className="relative bg-gradient-to-r from-[var(--voyage-accent)]/20 to-purple-500/20 rounded-3xl p-8 md:p-12 border border-[var(--voyage-border)] overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[var(--voyage-accent)]/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="h-24 w-24 rounded-full bg-[var(--voyage-bg-light)] flex items-center justify-center border-2 border-[var(--voyage-accent)]/30">
            <Globe className="h-12 w-12 text-[var(--voyage-accent)]" />
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {regionName} eSIM Plans
            </h1>
            <p className="text-[var(--voyage-muted)]">
              {regionSlug === "global" 
                ? "Choose from our global coverage plans"
                : `Browse eSIM plans for countries in ${regionName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Global Region - Show Global Plan Cards */}
      {regionSlug === "global" ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Global eSIM Plans</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* GL-120 Card */}
            <Link
              href="/countries/global-120-esim"
              className="group bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-[var(--voyage-bg-light)] flex items-center justify-center border border-[var(--voyage-border)]">
                    <span className="text-xs font-bold text-[var(--voyage-muted)]">GL</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Global (120+ areas)</h3>
                    <p className="text-sm text-[var(--voyage-muted)]">120+ countries coverage</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--voyage-muted)] group-hover:text-[var(--voyage-accent)] transition-colors" />
              </div>
            </Link>

            {/* GL-139 Card */}
            <Link
              href="/countries/global-139-esim"
              className="group bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-[var(--voyage-bg-light)] flex items-center justify-center border border-[var(--voyage-border)]">
                    <span className="text-xs font-bold text-[var(--voyage-muted)]">GL</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Global (130+ areas)</h3>
                    <p className="text-sm text-[var(--voyage-muted)]">130+ countries coverage</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--voyage-muted)] group-hover:text-[var(--voyage-accent)] transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      ) : (
        /* Countries Grid for other regions */
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Countries in {regionName} ({countries.length})
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <CountrySkeleton key={i} />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-20 text-[var(--voyage-muted)]">
              No countries found for this region
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {countries.map((country) => (
                <CountryCard key={country.code} country={country} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


