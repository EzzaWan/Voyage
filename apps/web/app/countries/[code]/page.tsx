import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/FlagIcon";

// This is a Server Component
export default async function CountryPlansPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  // Fetch plans
  let plans: Plan[] = [];
  let countryName = code;

  try {
    // Parallel fetch if we had a separate country details endpoint, 
    // but for now we might just get plans.
    // Ideally we'd fetch country name too.
    // Let's try to fetch plans first.
    const res = await fetch(`${apiUrl}/countries/${code}/plans`, { cache: 'no-store' });
    if (res.ok) {
      plans = await res.json();
    }
    
    // Infer country name from first plan or just use code for now if we don't have a lookup
    if (plans.length > 0) {
       // e.g. plan.location might be "Japan"
       // But the plan object structure in PlanCard uses "location" as code usually?
       // Let's assume we just display the code or try to fetch country list to find name if strictly needed.
       // For simplicity/performance, we'll display Code or first plan's location name if available.
    }
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/countries">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all mb-4 text-gray-500">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Countries
          </Button>
        </Link>
        
        <div className="flex items-center gap-4">
           <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
              <FlagIcon alt={code} className="h-full w-full border-none" /> 
              {/* Note: FlagIcon logic for getting image requires url, we might not have it here easily without extra fetch. 
                  We'll rely on fallback or if we had a context/store. 
                  For MVP, fallback text is fine. */}
           </div>
           <div>
              <h1 className="text-3xl font-bold">eSIMs for {code}</h1>
              <p className="text-gray-500">Stay connected with high-speed data</p>
           </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No plans available for this region yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.packageCode} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
