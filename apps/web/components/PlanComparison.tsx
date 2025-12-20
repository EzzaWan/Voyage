"use client";

import { useState } from "react";
import { Plan } from "./PlanCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, CheckCircle2 } from "lucide-react";
import { useCurrency } from "./providers/CurrencyProvider";
import { getDiscount } from "@/lib/admin-discounts";
import { calculateGB, getFinalPriceUSD } from "@/lib/plan-utils";
import Link from "next/link";

interface PlanComparisonProps {
  plans: Plan[];
  onClose: () => void;
  onRemove?: (packageCode: string) => void;
}

export function PlanComparison({ plans, onClose, onRemove }: PlanComparisonProps) {
  const { convert, formatCurrency } = useCurrency();
  const maxPlans = 4; // Limit comparison to 4 plans

  if (plans.length === 0) {
    return null;
  }

  const displayPlans = plans.slice(0, maxPlans);

  const getPlanValue = (plan: Plan) => {
    const gb = calculateGB(plan.volume);
    const discount = getDiscount(plan.packageCode, gb);
    const priceUSD = getFinalPriceUSD(plan, discount);
    return gb > 0 && priceUSD > 0 ? gb / priceUSD : 0; // GB per dollar
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader className="border-b border-[var(--voyage-border)]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-white">Compare Plans</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[var(--voyage-muted)] hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {displayPlans.map((plan) => {
              const gb = calculateGB(plan.volume);
              const discount = getDiscount(plan.packageCode, gb);
              const priceUSD = getFinalPriceUSD(plan, discount);
              const convertedPrice = convert(priceUSD);
              const value = getPlanValue(plan);
              const durationDays = plan.durationUnit?.toLowerCase() === 'day' 
                ? plan.duration 
                : plan.duration * 30;

              return (
                <div
                  key={plan.packageCode}
                  className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-lg p-4 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {gb.toFixed(1)} GB
                      </h3>
                      <p className="text-sm text-[var(--voyage-muted)] line-clamp-2">
                        {plan.name}
                      </p>
                    </div>
                    {onRemove && (
                      <button
                        onClick={() => onRemove(plan.packageCode)}
                        className="text-[var(--voyage-muted)] hover:text-white ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="text-xs text-[var(--voyage-muted)] mb-1">Price</div>
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(convertedPrice)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--voyage-muted)] mb-1">Duration</div>
                      <div className="text-sm text-white">
                        {plan.duration} {plan.durationUnit}s
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--voyage-muted)] mb-1">Data</div>
                      <div className="text-sm text-white">
                        {gb.toFixed(1)} GB
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--voyage-muted)] mb-1">Value</div>
                      <div className="text-sm text-[var(--voyage-accent)] font-semibold">
                        {value.toFixed(2)} GB/$
                      </div>
                    </div>

                    {plan.speed && (
                      <div>
                        <div className="text-xs text-[var(--voyage-muted)] mb-1">Speed</div>
                        <div className="text-sm text-white">{plan.speed}</div>
                      </div>
                    )}
                  </div>

                  <Link href={`/plans/${plan.packageCode}`} className="mt-4">
                    <Button className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)]/80 text-white">
                      View Details
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {plans.length > maxPlans && (
            <div className="mt-4 text-center text-sm text-[var(--voyage-muted)]">
              Showing {maxPlans} of {plans.length} plans. Remove plans to compare more.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

