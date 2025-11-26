"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { FlagIcon } from "@/components/FlagIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

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
        const res = await fetch(`${apiUrl}/countries`);
        const data = await res.json();
        // Sort alphabetically
        const sorted = (data || []).sort((a: Country, b: Country) => a.name.localeCompare(b.name));
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
           Where are you traveling?
        </h1>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {[...Array(12)].map((_, i) => (
             <Skeleton key={i} className="h-20 rounded-xl" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {filtered.map((country) => (
             <Link key={country.code} href={`/countries/${country.code}`}>
                <Card className="hover:border-blue-500 transition-all hover:shadow-md group">
                   <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                         <FlagIcon logoUrl={country.locationLogo} alt={country.name} />
                         <span className="font-medium group-hover:text-blue-600 transition-colors">
                           {country.name}
                         </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                   </CardContent>
                </Card>
             </Link>
           ))}
        </div>
      )}
    </div>
  );
}

