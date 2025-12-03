import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/components/PlanDetails";
import { PlanDetailsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";

// Server Component
export default async function PlanPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

  let plan = null;

  try {
    const res = await fetch(`${apiUrl}/plans/${id}`, { cache: 'no-store' });
    if (res.ok) {
      plan = await res.json();
    }
  } catch (e) {
    console.error(e);
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Plan Not Found</h1>
        <Link href="/countries">
          <Button variant="secondary">Browse Plans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/countries/${plan.location || ''}`}>
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-[var(--voyage-muted)] hover:text-white hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>
      </Link>
      
      <div className="text-sm text-[var(--voyage-muted)]">
        Not sure if your device supports eSIM? <Link href="/device-check" className="text-[var(--voyage-accent)] hover:underline">Check compatibility</Link>
      </div>
      
      <Suspense fallback={<PlanDetailsSkeleton />}>
         <PlanDetails plan={plan} />
      </Suspense>
    </div>
  );
}
