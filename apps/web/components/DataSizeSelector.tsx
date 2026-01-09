"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataSizeSelectorProps {
  sizes: number[]; // Array of GB sizes
  selectedSize: number | null;
  onSelect: (size: number) => void;
  disabled?: boolean;
}

/**
 * Step 1: Data Size Selector
 * User selects the data amount (GB) they want
 */
export function DataSizeSelector({
  sizes,
  selectedSize,
  onSelect,
  disabled = false,
}: DataSizeSelectorProps) {
  // Sort sizes ascending
  const sortedSizes = [...sizes].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Step 1: Choose Your Data Size
        </h2>
        <p className="text-[var(--voyo-muted)] text-sm">
          Select how much data you need
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedSizes.map((size) => {
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => !disabled && onSelect(size)}
              disabled={disabled}
              className={cn(
                "relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-[var(--voyo-accent)] focus:ring-offset-2 focus:ring-offset-[var(--voyo-bg)]",
                isSelected
                  ? "border-[var(--voyo-accent)] bg-[var(--voyo-accent)]/10 shadow-lg shadow-[var(--voyo-accent)]/20"
                  : "border-[var(--voyo-border)] bg-[var(--voyo-card)] hover:border-[var(--voyo-accent)]/50 hover:bg-[var(--voyo-card)]/80",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${size} GB data plan`}
            >
              <div className="text-3xl font-bold text-white mb-1">
                {size} <span className="text-lg text-[var(--voyo-muted)]">GB</span>
              </div>
              
              {isSelected && (
                <Badge
                  variant="outline"
                  className="mt-2 border-[var(--voyo-accent)] text-[var(--voyo-accent)] bg-[var(--voyo-accent)]/10"
                >
                  Selected
                </Badge>
              )}
              
              {/* Hover effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-[var(--voyo-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          );
        })}
      </div>

      {sortedSizes.length === 0 && (
        <div className="text-center py-8 text-[var(--voyo-muted)]">
          No data plans available
        </div>
      )}
    </div>
  );
}







