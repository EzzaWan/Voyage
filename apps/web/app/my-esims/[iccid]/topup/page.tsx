"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
import { Wifi, ArrowLeft, Signal, Globe, ArrowRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PlanListWithFilters } from "@/components/PlanListWithFilters";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";

interface TopUpOption {
  packageCode: string;
  name: string;
  price: number;
  currencyCode?: string;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
}

export default function TopUpSelectionPage() {
  const { iccid } = useParams();
  const { selectedCurrency, convert, formatCurrency } = useCurrency();
  const [options, setOptions] = useState<TopUpOption[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Fetch profile details for better title
      try {
        const profileData = await safeFetch<any>(`${apiUrl}/esim/${iccid}`, { showToast: false });
        setProfile(profileData);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }

      // Fetch top-up options
      const data = await safeFetch<TopUpOption[]>(`${apiUrl}/esim/topup-options?iccid=${iccid}`, { showToast: false });
      setOptions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iccid) fetchData();
  }, [iccid]);

  const handleCheckout = async (plan: TopUpOption) => {
    try {
      const priceUSD = plan.price || 0;
      
      const data = await safeFetch<{ url?: string }>(`${process.env.NEXT_PUBLIC_API_URL}/topup/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iccid,
          planCode: plan.packageCode,
          amount: priceUSD, // Send original USD price
          currency: selectedCurrency,
          displayCurrency: selectedCurrency,
        }),
        errorMessage: "Failed to start checkout. Please try again.",
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("TopUp Checkout error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link href={`/my-esims/${iccid}`} className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to eSIM Details
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Top-Up {profile?.planDetails?.name || 'eSIM'}
          </h1>
          {iccid && (
            <p className="text-sm text-[var(--voyage-muted)] mt-1 font-mono">
              {iccid}
            </p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Card */}
      <div className="bg-[var(--voyage-card)]/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[var(--voyage-border)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wifi className="h-64 w-64 text-[var(--voyage-accent)]" />
          </div>
          
          <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Select a Top-Up Plan</h2>
              <p className="text-[var(--voyage-muted)]">Add more data to your existing eSIM. Instant activation.</p>
          </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-20 text-[var(--voyage-muted)]">Loading top-up options...</div>
      ) : options.length === 0 ? (
        <EmptyState
          title="No top-up plans available"
          description="No compatible top-up plans were found for this eSIM. Please contact support if you need assistance."
          icon={Package}
          action={{
            label: "Back to eSIM Details",
            onClick: () => window.location.href = `/my-esims/${iccid}`
          }}
        />
      ) : (
        <PlanListWithFilters
          plans={options}
          renderItem={(plan) => {
            const sizeGB = (plan.volume / 1024 / 1024 / 1024).toFixed(1);
            const priceUSD = plan.price || 0;
            const convertedPrice = convert(priceUSD);
            
            return (
              <div key={plan.packageCode} className="group h-full flex flex-col bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 shadow-lg hover:shadow-[var(--voyage-accent)]/20 hover:border-[var(--voyage-accent)] transition-all duration-300 cursor-pointer relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                   <div className="flex flex-col">
                      <Badge variant="outline" className="w-fit border-[var(--voyage-accent)] text-[var(--voyage-accent)] mb-2 bg-[var(--voyage-accent)]/10">
                         {plan.duration} {plan.durationUnit}s
                      </Badge>
                      <h3 className="text-2xl font-bold text-white group-hover:text-[var(--voyage-accent)] transition-colors">
                         {sizeGB} GB
                      </h3>
                   </div>
                   <div className="h-10 w-10 rounded-full bg-[var(--voyage-bg-light)] flex items-center justify-center text-[var(--voyage-accent-soft)] group-hover:bg-[var(--voyage-accent)] group-hover:text-white transition-colors">
                      <Signal className="h-5 w-5" />
                   </div>
                </div>

                {/* Content */}
                <div className="flex-grow space-y-4">
                   <div className="text-sm text-[var(--voyage-muted)] line-clamp-2 min-h-[2.5rem]">
                      {plan.name}
                   </div>
                   
                   <div className="flex items-center gap-2 text-xs text-[var(--voyage-muted)]">
                      <Globe className="h-3 w-3 text-[var(--voyage-accent-soft)]" />
                      <span>{plan.location} Region</span>
                   </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-[var(--voyage-border)] flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-xs text-[var(--voyage-muted)] uppercase tracking-wider">Price</span>
                      <span className="text-xl text-white font-bold">
                        {formatCurrency(convertedPrice)}
                      </span>
                   </div>
                   <Button 
                      size="sm" 
                      onClick={() => handleCheckout(plan)}
                      className="bg-[var(--voyage-bg-light)] hover:bg-[var(--voyage-accent)] text-[var(--voyage-text)] hover:text-white border border-[var(--voyage-border)] group-hover:border-[var(--voyage-accent)] transition-all"
                   >
                      Top Up <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
