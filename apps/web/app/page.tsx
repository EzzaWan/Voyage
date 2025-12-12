"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { CountryCard } from "@/components/CountryCard";
import { CountrySkeleton } from "@/components/skeletons";
import { Globe, ArrowRight } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { getRegionForCountry, REGION_NAMES, Region } from "@/lib/regions";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        console.log('[HOME] Received countries data:', data);
        // Handle both array and { locationList: [...] } formats
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        console.log('[HOME] Countries array:', countriesArray.slice(0, 3));
        const sorted = (countriesArray || []).sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        setCountries(sorted);
        setFiltered(sorted);
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Group countries by region
  const countriesByRegion = useMemo(() => {
    const grouped: Record<Region, Country[]> = {
      "asia": [],
      "europe": [],
      "north-america": [],
      "south-america": [],
      "africa": [],
      "oceania": [],
      "global": [],
    };

    countries.forEach((country) => {
      const region = getRegionForCountry(country.code);
      if (region) {
        grouped[region].push(country);
      }
    });

    return grouped;
  }, [countries]);

  useEffect(() => {
    if (!search) {
      setFiltered(countries);
    } else {
      const lower = search.toLowerCase();
      setFiltered(countries.filter(c => c.name.toLowerCase().includes(lower)));
    }
  }, [search, countries]);

  const regions: Region[] = ["asia", "europe", "north-america", "south-america", "africa", "oceania", "global"];

  return (
    <div className="min-h-[80vh] flex flex-col space-y-8">
       <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] mb-2">
             <Globe className="h-6 w-6 text-[var(--voyage-accent)]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
             Where are you <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--voyage-accent)] to-purple-400">traveling next?</span>
          </h1>
          <p className="text-lg text-[var(--voyage-muted)]">
             Stay connected in 200+ countries with instant eSIM delivery. No hidden fees. No roaming charges.
          </p>
          
          <div className="pt-2 flex justify-center w-full">
             <SearchBar value={search} onChange={setSearch} />
          </div>
          
          <Link href="/device-check" className="text-sm text-[var(--voyage-accent)] hover:underline transition-colors">
            Check if your phone supports eSIM
          </Link>
       </div>

       {/* Region Sections */}
       {!search && (
         <div className="space-y-4">
           <div className="text-center">
             <h2 className="text-xl font-bold text-white mb-1">Browse by Region</h2>
             <p className="text-sm text-[var(--voyage-muted)]">Explore eSIM plans by region</p>
           </div>
           
           {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 animate-pulse">
                   <div className="h-6 bg-[var(--voyage-bg-light)] rounded mb-2 w-24"></div>
                   <div className="h-4 bg-[var(--voyage-bg-light)] rounded w-32"></div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               {regions.map((region) => {
                 const regionCountries = countriesByRegion[region];
                 // Always show Global region, even if empty
                 if (region !== "global" && regionCountries.length === 0) return null;
                 
                 return (
                   <Link
                     key={region}
                     href={`/regions/${region}`}
                     className="group bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)] transition-all"
                   >
                     <div className="flex items-center justify-between">
                       <div>
                         <h3 className="text-xl font-bold text-white mb-1">
                           {REGION_NAMES[region]}
                         </h3>
                         <p className="text-sm text-[var(--voyage-muted)]">
                           {region === "global" ? "130+ countries" : `${regionCountries.length} countries`}
                         </p>
                       </div>
                       <ArrowRight className="h-5 w-5 text-[var(--voyage-muted)] group-hover:text-[var(--voyage-accent)] transition-colors" />
                     </div>
                   </Link>
                 );
               })}
             </div>
           )}
         </div>
       )}

       {/* All Countries Grid */}
       <div className="space-y-4">
         <h2 className="text-2xl font-bold text-white">
           {search ? `Search Results` : "All Countries"}
         </h2>
         
         {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(12)].map((_, i) => (
                <CountrySkeleton key={i} />
              ))}
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-in fade-in duration-1000">
              {filtered.map((country) => (
                 <CountryCard key={country.code} country={country} />
              ))}
              
              {filtered.length === 0 && (
                 <div className="col-span-full text-center py-20 text-[var(--voyage-muted)]">
                    No countries found matching "{search}"
                 </div>
              )}
           </div>
         )}
       </div>
    </div>
  );
}

