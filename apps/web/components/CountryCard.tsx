import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FlagIcon } from "./FlagIcon";
import { getSlugFromCode } from "@/lib/country-slugs";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export function CountryCard({ country }: { country: Country }) {
  // Use slug-based URL if available, fallback to code
  const slug = getSlugFromCode(country.code) || country.code.toLowerCase();
  return (
    <Link href={`/countries/${slug}`} className="h-full block">
      <div className="h-full group bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-5 shadow-sm hover:shadow-xl hover:bg-[var(--voyage-card-hover)] hover:border-[var(--voyage-accent)]/30 transition-all cursor-pointer flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
           <FlagIcon logoUrl={country.locationLogo} alt={country.name} className="h-8 w-11 rounded-md border-2 border-[var(--voyage-border)] shadow-sm" />
           <span className="font-medium text-lg text-[var(--voyage-text)] group-hover:text-white transition-colors">
             {country.name}
           </span>
        </div>
        
        <div className="bg-[var(--voyage-bg-light)] p-2 rounded-full group-hover:bg-[var(--voyage-accent)] transition-colors z-10">
           <ChevronRight className="h-4 w-4 text-[var(--voyage-muted)] group-hover:text-white" />
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--voyage-accent)]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      </div>
    </Link>
  );
}

