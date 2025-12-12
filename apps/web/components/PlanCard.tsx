import Link from "next/link";
import { ArrowRight, Signal, Globe, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "./PriceTag";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "./FlagIcon";
import { useCurrency } from "./providers/CurrencyProvider";
import { getDiscount } from "@/lib/admin-discounts";
import { calculateFinalPrice } from "@/lib/plan-utils";

export interface Plan {
  packageCode: string;
  name: string;
  price: number; // Price amount (e.g. 0.25, 10.50) - already in USD from backend
  currencyCode?: string; // ISO currency code (e.g. "USD", "PLN", "EUR")
  volume: number; // bytes
  duration: number;
  durationUnit: string;
  speed: string;
  location: string;
  locationNetworkList?: { locationCode: string }[];
}

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const { convert, formatCurrency } = useCurrency();
  const sizeGB = plan.volume / 1024 / 1024 / 1024;
  const sizeGBRounded = sizeGB.toFixed(1);
  const isUnlimited = plan.volume === -1; // Assuming -1 or similar for unlimited if applicable
  const regionCount = plan.locationNetworkList?.length || 1;
  
  // Get discount (frontend-only) - check individual first, then global GB
  const discountPercent = getDiscount(plan.packageCode, sizeGB);
  
  // Calculate final price with discount (frontend-only)
  const basePriceUSD = plan.price || 0;
  const finalPriceUSD = calculateFinalPrice(basePriceUSD, discountPercent);
  const hasDiscount = discountPercent > 0;
  
  // Convert to selected currency for display
  const convertedPrice = convert(finalPriceUSD);

  return (
    <Link href={`/plans/${plan.packageCode}`}>
      <div className="group h-full flex flex-col bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 shadow-lg hover:shadow-[var(--voyage-accent)]/20 hover:border-[var(--voyage-accent)] transition-all duration-300 cursor-pointer relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
           <div className="flex flex-col">
              <Badge variant="outline" className="w-fit border-[var(--voyage-accent)] text-[var(--voyage-accent)] mb-2 bg-[var(--voyage-accent)]/10">
                 {plan.duration} {plan.durationUnit}s
              </Badge>
              <h3 className="text-2xl font-bold text-white group-hover:text-[var(--voyage-accent)] transition-colors">
                 {isUnlimited ? "Unlimited" : `${sizeGBRounded} GB`}
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
              <span>Includes {regionCount} region{regionCount > 1 ? 's' : ''}</span>
           </div>
           
           {/* Flags mini-list if multi-region */}
           {regionCount > 1 && (
              <div className="flex -space-x-2 overflow-hidden py-1">
                 {plan.locationNetworkList?.slice(0, 5).map((net, i) => (
                    <div key={i} className="relative h-6 w-6 rounded-full border border-[var(--voyage-card)] bg-[var(--voyage-bg)]">
                       <div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-500 font-bold">
                         {net.locationCode}
                       </div>
                    </div>
                 ))}
                 {regionCount > 5 && (
                   <div className="relative h-6 w-6 rounded-full border border-[var(--voyage-card)] bg-[var(--voyage-bg-light)] flex items-center justify-center text-[8px] text-[var(--voyage-muted)]">
                     +{regionCount - 5}
                   </div>
                 )}
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--voyage-border)] flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-xs text-[var(--voyage-muted)] uppercase tracking-wider">Price</span>
              <div className="flex items-baseline gap-2">
                {hasDiscount && (
                  <span className="text-sm text-[var(--voyage-muted)] line-through">
                    {formatCurrency(convert(basePriceUSD))}
                  </span>
                )}
                <span className="text-xl text-white font-bold">
                  {formatCurrency(convertedPrice)}
                </span>
              </div>
              {hasDiscount && (
                <span className="text-xs text-[var(--voyage-accent)] mt-0.5">
                  {discountPercent}% off
                </span>
              )}
           </div>
           <Button size="sm" className="bg-[var(--voyage-bg-light)] hover:bg-[var(--voyage-accent)] text-[var(--voyage-text)] hover:text-white border border-[var(--voyage-border)] group-hover:border-[var(--voyage-accent)] transition-all">
              Select <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
        </div>
      </div>
    </Link>
  );
}
