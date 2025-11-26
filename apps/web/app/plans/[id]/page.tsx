import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/components/PlanDetails";

// Server Component
export default async function PlanPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
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
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Plan Not Found</h1>
        <Link href="/countries">
          <Button>Browse Plans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/countries/${plan.location || ''}`}>
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all mb-6 text-gray-500">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>
      </Link>
      
      <PlanDetails plan={plan} />
    </div>
  );
}
