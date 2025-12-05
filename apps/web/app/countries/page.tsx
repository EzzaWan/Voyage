"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CountryCard } from "@/components/CountryCard";
import { CountrySkeleton } from "@/components/skeletons";
import { Globe } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        // Handle both array and { locationList: [...] } formats
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
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

  useEffect(() => {
    if (!search) {
      setFiltered(countries);
    } else {
      const lower = search.toLowerCase();
      setFiltered(countries.filter(c => c.name.toLowerCase().includes(lower)));
    }
  }, [search, countries]);

  return (
    <div className="min-h-[80vh] flex flex-col">
       <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] mb-4">
             <Globe className="h-6 w-6 text-[var(--voyage-accent)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
             Where are you <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--voyage-accent)] to-purple-400">traveling next?</span>
          </h1>
          <p className="text-lg text-[var(--voyage-muted)]">
             Stay connected in 200+ countries with instant eSIM delivery. No hidden fees. No roaming charges.
          </p>
          
          <div className="pt-4 flex justify-center w-full">
             <SearchBar value={search} onChange={setSearch} />
          </div>
       </div>

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
  );
}
