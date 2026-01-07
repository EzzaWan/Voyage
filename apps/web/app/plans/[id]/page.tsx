"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanDetails } from "@/components/PlanDetails";
import { PlanDetailsSkeleton } from "@/components/skeletons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { safeFetch } from "@/lib/safe-fetch";
import { useParams, useRouter } from "next/navigation";
import { fetchDiscounts } from "@/lib/admin-discounts";
import { getSlugFromCode } from "@/lib/country-slugs";
import { addToRecentlyViewed } from "@/lib/recently-viewed";
import { getPlanFlagLabels } from "@/lib/plan-flags";
import { isDailyUnlimitedPlan } from "@/lib/plan-utils";

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
        
        // Track recently viewed
        if (data?.name) {
          addToRecentlyViewed({
            id: id,
            name: data.name,
            href: `/plans/${id}`,
          });
        }
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

  // Get plan display name for breadcrumb (replace 2GB with Unlimited for unlimited plans)
  const getPlanDisplayName = () => {
    if (!plan) return id;
    
    const flagInfo = getPlanFlagLabels(plan);
    let displayName = flagInfo.cleanedName || plan.name || id;
    
    // Replace "2GB" with "Unlimited" for unlimited plans (2GB + FUP1Mbps)
    if (isDailyUnlimitedPlan(plan)) {
      displayName = displayName
        .replace(/\b2gb\b/gi, 'Unlimited')
        .replace(/\b2\s*gb\b/gi, 'Unlimited')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return displayName || id;
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Plans", href: "/countries" },
    { label: getPlanDisplayName(), href: `/plans/${id}` },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
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
