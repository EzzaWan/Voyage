"use client";

import { Check, Info } from "lucide-react";
import Image from "next/image";

export function PriceComparison() {
  return (
    <div className="bg-[var(--voyo-card)] border border-[var(--voyo-border)] rounded-2xl p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Save up to 35%
          </h2>
          <p className="text-sm text-[var(--voyo-muted)]">Vs leading providers on similar plans</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--voyo-muted)] bg-[var(--voyo-bg-light)] border border-[var(--voyo-border)] px-2 py-1 rounded-full self-start md:self-auto">
          <Info className="w-3 h-3" />
          <span>Based on public prices</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Competitor 1: Airalo */}
        <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-lg bg-[var(--voyo-bg-light)]/50 border border-[var(--voyo-border)] opacity-70">
          <div className="h-5 relative w-full mb-2 opacity-60 grayscale">
            <Image 
              src="/images/competitors/airalo.jpg" 
              alt="Airalo" 
              fill 
              className="object-contain invert brightness-200"
            />
          </div>
          <div className="text-[9px] text-[var(--voyo-muted)] font-medium whitespace-nowrap">
            +25%
          </div>
        </div>

        {/* Competitor 2: Holafly */}
        <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-lg bg-[var(--voyo-bg-light)]/50 border border-[var(--voyo-border)] opacity-70">
          <div className="h-5 relative w-full mb-2 opacity-60 grayscale">
            <Image 
              src="/images/competitors/holafly.webp" 
              alt="Holafly" 
              fill 
              className="object-contain invert brightness-200"
            />
          </div>
          <div className="text-[9px] text-[var(--voyo-muted)] font-medium whitespace-nowrap">
            +34%
          </div>
        </div>

        {/* Competitor 3: Saily */}
        <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-lg bg-[var(--voyo-bg-light)]/50 border border-[var(--voyo-border)] opacity-70">
          <div className="h-5 relative w-full mb-2 opacity-60 grayscale">
            <Image 
              src="/images/competitors/saily.webp" 
              alt="Saily" 
              fill 
              className="object-contain invert brightness-200"
            />
          </div>
          <div className="text-[9px] text-[var(--voyo-muted)] font-medium whitespace-nowrap">
            +28%
          </div>
        </div>

        {/* Highlighted: Voyo - Flat 2D */}
        <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-lg bg-[var(--voyo-accent)] border border-[var(--voyo-accent)]">
          <div className="font-bold text-base text-white mb-1 leading-none">Voyo</div>
          <div className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            Best
          </div>
        </div>
      </div>
    </div>
  );
}
