"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/components/PlanDetails";
import { PlanDetailsSkeleton } from "@/components/skeletons";
import { safeFetch } from "@/lib/safe-fetch";
import { useParams } from "next/navigation";

export default function PlanPage() {
  const params = useParams();
  const id = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPlan = async () => {
      try {
        const data = await safeFetch<any>(`${apiUrl}/plans/${id}`, { showToast: false });
        setPlan(data);
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, apiUrl]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PlanDetailsSkeleton />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Plan Not Found</h1>
        <p className="text-[var(--voyage-muted)] mb-6">The plan you're looking for doesn't exist or has been removed.</p>
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
      
      <PlanDetails plan={plan} />
    </div>
  );
}
