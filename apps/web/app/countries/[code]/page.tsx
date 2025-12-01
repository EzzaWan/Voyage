import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/FlagIcon";
import { formatUsdDollars } from "@/lib/utils";

// Server Component
export default async function CountryPlansPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  let plans: Plan[] = [];
  // We could fetch country details here if API supported it, or filter from plans

  try {
    const res = await fetch(`${apiUrl}/countries/${code}/plans`, { cache: 'no-store' });
    if (res.ok) {
      plans = await res.json();
    }
  } catch (e) {
    console.error(e);
  }
  
  // Calculate lowest price
  const lowestPrice = plans.length > 0 ? Math.min(...plans.map(p => p.price)) : 0;

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
                 <FlagIcon alt={code} className="h-full w-full border-none rounded-full object-cover" />
                 {/* Ideally pass image url if available */}
               </div>
            </div>
            
            <div className="text-center md:text-left space-y-2">
               <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {code} eSIMs
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

      {/* Plans Grid */}
      <div className="space-y-4">
         <h2 className="text-2xl font-bold text-white pl-2">Available Packages</h2>
         
         {plans.length === 0 ? (
            <div className="text-center py-20 bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)]">
               <p className="text-[var(--voyage-muted)]">No plans currently available for this region.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {plans.map((plan) => (
                  <PlanCard key={plan.packageCode} plan={plan} />
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
