"use client";

import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPlanFlagLabels, type PlanFlagInfo } from "@/lib/plan-flags";

interface PlanFlagsProps {
  plan: any;
  className?: string;
  variant?: 'colored' | 'neutral'; // 'neutral' removes color coding for list pages
  showIP?: boolean; // Whether to show IP location badge (default: true)
}

export function PlanFlags({ plan, className = "", variant = 'colored', showIP = true }: PlanFlagsProps) {
  const flagInfo = getPlanFlagLabels(plan);

  // Don't render anything if there are no flags to show
  const hasFlagsToShow = (showIP && flagInfo.ipType) || flagInfo.fup;
  if (!hasFlagsToShow || flagInfo.rawFlags.length === 0) {
    return null;
  }

  const isNeutral = variant === 'neutral';
  
  // Neutral styling for list pages (no color coding)
  const ipBadgeClass = isNeutral
    ? "border-[var(--voyo-border)] bg-transparent text-[var(--voyo-muted)]"
    : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20";
  
  const fupBadgeClass = isNeutral
    ? "border-[var(--voyo-border)] bg-transparent text-[var(--voyo-muted)] cursor-help flex items-center gap-1 pointer-events-auto"
    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 cursor-help flex items-center gap-1 pointer-events-auto";

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {/* IP Type Badge - only show if showIP is true */}
        {showIP && flagInfo.ipType && (
          <Badge
            variant="outline"
            className={ipBadgeClass}
          >
            {flagInfo.ipType.label}
          </Badge>
        )}

        {/* FUP Badge with Tooltip */}
        {flagInfo.fup && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex cursor-help">
                <Badge
                  variant="outline"
                  className={fupBadgeClass}
                >
                  {flagInfo.fup.label}
                  <Info className="h-3 w-3" />
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top"
              className="max-w-sm bg-[var(--voyo-card)] border-[var(--voyo-border)] text-white p-3 z-[100]"
              sideOffset={8}
            >
              <p className="text-sm leading-relaxed whitespace-normal">{flagInfo.fup.description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

