"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanCard, Plan } from "@/components/PlanCard";
import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";
import { useCurrency } from "./providers/CurrencyProvider";
import { getDiscount } from "@/lib/admin-discounts";
import { calculateGB } from "@/lib/plan-utils";
import { calculateFinalPrice } from "@/lib/plan-utils";

interface DurationOption {
  duration: number;
  durationUnit: string;
  plan: Plan;
}

interface DurationSelectorProps {
  durations: DurationOption[];
  selectedPlan: Plan | null;
  onSelectPlan: (plan: Plan) => void;
  onBack?: () => void;
  selectedSize: number;
}

/**
 * Step 2: Duration Selector
 * User selects the duration for the chosen data size
 * Displays plan cards with final prices (including discounts)
 */
export function DurationSelector({
  durations,
  selectedPlan,
  onSelectPlan,
  onBack,
  selectedSize,
}: DurationSelectorProps) {
  const { convert, formatCurrency, rates } = useCurrency();

  // Sort durations by length (shorter to longer)
  const sortedDurations = [...durations].sort((a, b) => {
    // Normalize to days for comparison
    const aDays = a.durationUnit.toLowerCase() === "day" ? a.duration : a.duration * 30;
    const bDays = b.durationUnit.toLowerCase() === "day" ? b.duration : b.duration * 30;
    return aDays - bDays;
  });

  const formatDuration = (duration: number, unit: string): string => {
    const plural = duration !== 1 ? "s" : "";
    return `${duration} ${unit}${plural}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Step 2: Choose Your Duration
          </h2>
          <p className="text-[var(--voyage-muted)] text-sm">
            Available validity periods for {selectedSize} GB plans
          </p>
        </div>
        
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[var(--voyage-muted)] hover:text-white"
          >
            ← Change Size
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedDurations.map((option) => {
          const { plan } = option;
          const isSelected = selectedPlan?.packageCode === plan.packageCode;
          
          // Get discount for this plan (frontend-only) - check individual first, then global GB
          const planGB = calculateGB(plan.volume);
          const discountPercent = getDiscount(plan.packageCode, planGB);
          
          // Calculate final price with discount (frontend-only calculation)
          const basePriceUSD = plan.price; // Already in USD from backend
          const finalPriceUSD = calculateFinalPrice(basePriceUSD, discountPercent);
          
          // Convert to user's selected currency for display
          const convertedPrice = convert(finalPriceUSD);
          const hasDiscount = discountPercent > 0;

          return (
            <div
              key={`${plan.duration}-${plan.durationUnit}-${plan.packageCode}`}
              className={cn(
                "relative",
                isSelected && "ring-2 ring-[var(--voyage-accent)] rounded-xl"
              )}
            >
              <div
                onClick={() => onSelectPlan(plan)}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "opacity-100",
                  !isSelected && "hover:scale-105"
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectPlan(plan);
                  }
                }}
                aria-label={`Select ${formatDuration(plan.duration, plan.durationUnit)} plan`}
              >
                <div
                  className={cn(
                    "flex flex-col p-6 rounded-xl border-2 transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--voyage-accent)]",
                    isSelected
                      ? "border-[var(--voyage-accent)] bg-[var(--voyage-accent)]/10"
                      : "border-[var(--voyage-border)] bg-[var(--voyage-card)] hover:border-[var(--voyage-accent)]/50"
                  )}
                >
                  {/* Duration Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-[var(--voyage-accent)]" />
                    <Badge
                      variant="outline"
                      className="border-[var(--voyage-accent)] text-[var(--voyage-accent)]"
                    >
                      {formatDuration(plan.duration, plan.durationUnit)}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      {hasDiscount && (
                        <span className="text-sm text-[var(--voyage-muted)] line-through">
                          {formatCurrency(convert(basePriceUSD))}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-white">
                        {formatCurrency(convertedPrice)}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="text-xs text-[var(--voyage-accent)] mt-1">
                        {discountPercent}% discount applied
                      </div>
                    )}
                  </div>

                  {/* Plan details */}
                  <div className="text-sm text-[var(--voyage-muted)] space-y-1">
                    <div>{plan.name}</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Valid for {formatDuration(plan.duration, plan.durationUnit)}
                      </span>
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-[var(--voyage-border)]">
                      <Badge className="bg-[var(--voyage-accent)] text-white">
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedDurations.length === 0 && (
        <div className="text-center py-8 text-[var(--voyage-muted)]">
          No duration options available for {selectedSize} GB plans
        </div>
      )}
    </div>
  );
}


