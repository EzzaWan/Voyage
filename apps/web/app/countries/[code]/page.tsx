"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/FlagIcon";
import { formatUsdDollars } from "@/lib/utils";
import { PlanListWithFilters } from "@/components/PlanListWithFilters";
import { useEffect, useState } from "react";

export default function CountryPlansPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${apiUrl}/countries/${code}/plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [code, apiUrl]);
  
  const lowestPrice = plans.length > 0 ? Math.min(...plans.map(p => p.price)) : 0;
  
  // Derive country name:
  // 1. Try to get from first plan
  // 2. Use Intl.DisplayNames to convert code (e.g. AZ -> Azerbaijan)
  // 3. Fallback to code
  let countryName = code;
  try {
    if (plans.length > 0 && plans[0].location && plans[0].location !== code) {
      countryName = plans[0].location;
    } else {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      countryName = regionNames.of(code.toUpperCase()) || code;
    }
  } catch (e) {
    // Fallback to code if Intl fails or code is invalid
    countryName = code;
  }
  
  // Construct flag URL directly
  const flagUrl = `https://flagcdn.com/w320/${code.toLowerCase().split('-')[0]}.png`;

  return (
    <div className="space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/countries">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-[var(--voyage-muted)] hover:text-white hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
          </Button>
        </Link>
      </div>

      {/* Region Header */}
      <div className="relative bg-gradient-to-r from-[var(--voyage-accent)]/20 to-purple-500/20 rounded-3xl p-8 md:p-12 border border-[var(--voyage-border)] overflow-hidden">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[var(--voyage-accent)]/20 blur-3xl" />
         
         <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-white p-1 shadow-2xl shadow-[var(--voyage-accent)]/30">
               <div className="h-full w-full rounded-full overflow-hidden bg-gray-100 relative">
                 <FlagIcon logoUrl={flagUrl} alt={code} className="h-full w-full border-none rounded-full object-cover" />
               </div>
            </div>
            
            <div className="text-center md:text-left space-y-2">
               <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {countryName} eSIMs
               </h1>
               <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--voyage-muted)]">
                  <MapPin className="h-4 w-4" />
                  <span>Popular destination</span>
               </div>
               {lowestPrice > 0 && (
                  <div className="inline-block mt-2 px-4 py-1 rounded-full bg-[var(--voyage-accent)] text-white font-bold text-sm shadow-lg shadow-[var(--voyage-accent)]/30">
                     Plans starting from {formatUsdDollars(lowestPrice)}
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Plans Grid with Filters */}
      <div className="space-y-4">
         <h2 className="text-2xl font-bold text-white pl-2">Available Packages</h2>
         
         {loading ? (
             <div className="text-center py-20 text-[var(--voyage-muted)]">Loading plans...</div>
         ) : (
             <PlanListWithFilters 
                plans={plans} 
                renderItem={(plan) => <PlanCard key={plan.packageCode} plan={plan} />}
                emptyMessage="No plans available for this region matching your filters."
             />
         )}
      </div>
    </div>
  );
}

