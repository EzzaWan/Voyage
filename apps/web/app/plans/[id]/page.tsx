"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/components/PlanDetails";
import { PlanDetailsSkeleton } from "@/components/skeletons";
import { safeFetch } from "@/lib/safe-fetch";
import { useParams, useRouter } from "next/navigation";
import { fetchDiscounts } from "@/lib/admin-discounts";
import { getSlugFromCode } from "@/lib/country-slugs";

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

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

  // Determine back URL: if location is multi-country (has comma), use router.back()
  // Otherwise, convert single country code to slug
  const getBackUrl = () => {
    if (!plan.location) return '/';
    
    // If location contains comma, it's multi-country - use router.back()
    if (plan.location.includes(',')) {
      return null; // Will use router.back() instead
    }
    
    // Single country - convert to slug
    const slug = getSlugFromCode(plan.location);
    return slug ? `/countries/${slug}` : '/';
  };

  const backUrl = getBackUrl();
  const useBackNavigation = backUrl === null;

  const handleBackClick = (e: React.MouseEvent) => {
    if (useBackNavigation) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <div className="space-y-6">
      {useBackNavigation ? (
        <Button 
          variant="ghost" 
          className="pl-0 hover:pl-2 transition-all text-[var(--voyage-muted)] hover:text-white hover:bg-transparent"
          onClick={handleBackClick}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
        </Button>
      ) : (
        <Link href={backUrl}>
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-[var(--voyage-muted)] hover:text-white hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>
        </Link>
      )}
      
      <div className="text-sm text-[var(--voyage-muted)]">
        Not sure if your device supports eSIM? <Link href="/device-check" className="text-[var(--voyage-accent)] hover:underline">Check compatibility</Link>
      </div>
      
      <PlanDetails plan={plan} />
    </div>
  );
}
