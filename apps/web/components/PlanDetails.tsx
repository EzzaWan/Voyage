"use client";

import { Check, Smartphone, Shield, Wifi, Globe, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "./PriceTag";
import { FlagIcon } from "./FlagIcon";

export function PlanDetails({ plan }: { plan: any }) {
  const sizeGB = (plan.volume / 1024 / 1024 / 1024).toFixed(1);
  
  async function buyNow() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: plan.packageCode,
          currency: plan.currencyCode?.toLowerCase() || 'usd',
          amount: plan.price,
          planName: plan.name,
        }),
      });

      if (!res.ok) throw new Error('Order creation failed');

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column: Main Info */}
      <div className="lg:col-span-2 space-y-8">
        {/* Header Card */}
        <div className="bg-[var(--voyage-card)]/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[var(--voyage-border)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wifi className="h-64 w-64 text-[var(--voyage-accent)]" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--voyage-accent)]/20 text-[var(--voyage-accent)] text-sm font-medium border border-[var(--voyage-accent)]/30">
                        Data Only
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30">
                        eSIM
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{plan.name}</h1>
                <div className="flex flex-wrap gap-6 text-[var(--voyage-muted)]">
                   <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-[var(--voyage-accent)]" />
                      <span>{plan.location} Region</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-[var(--voyage-accent)]" />
                      <span>{plan.speed} Speed</span>
                   </div>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-colors">
              <span className="text-[var(--voyage-muted)] text-sm mb-1">Data</span>
              <span className="text-2xl font-bold text-white">{sizeGB} GB</span>
           </div>
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-colors">
              <span className="text-[var(--voyage-muted)] text-sm mb-1">Validity</span>
              <span className="text-2xl font-bold text-white">{plan.duration} Days</span>
           </div>
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-colors">
              <span className="text-[var(--voyage-muted)] text-sm mb-1">Type</span>
              <span className="text-xl font-bold text-white">Prepaid</span>
           </div>
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-colors">
              <span className="text-[var(--voyage-muted)] text-sm mb-1">Activation</span>
              <span className="text-xl font-bold text-white">Auto</span>
           </div>
        </div>

        {/* Coverage & Operators */}
        <div className="bg-[var(--voyage-card)] rounded-2xl p-8 border border-[var(--voyage-border)]">
           <h3 className="text-xl font-bold text-white mb-6">Coverage & Networks</h3>
           {plan.locationNetworkList && plan.locationNetworkList.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {plan.locationNetworkList.map((net: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)]">
                           <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-[var(--voyage-bg)] flex items-center justify-center text-xs font-bold border border-[var(--voyage-border)]">
                                   {net.locationCode}
                               </div>
                               <span className="text-sm font-medium">{net.operatorName || "Best Available"}</span>
                           </div>
                           <span className="text-xs text-[var(--voyage-muted)]">4G/LTE</span>
                       </div>
                   ))}
               </div>
           ) : (
               <div className="flex items-center gap-3 p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
                  <Globe className="h-5 w-5 text-[var(--voyage-accent)]" />
                  <span className="text-[var(--voyage-muted)]">Multi-network coverage across {plan.location}</span>
               </div>
           )}
        </div>
      </div>

      {/* Right Column: Checkout */}
      <div className="lg:col-span-1">
         <div className="sticky top-24 space-y-6">
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6 shadow-2xl shadow-black/40">
                 <div className="flex justify-between items-center mb-6 pb-6 border-b border-[var(--voyage-border)]">
                     <span className="text-[var(--voyage-muted)]">Total Price</span>
                     <PriceTag price={plan.price} className="text-4xl text-white" />
                 </div>
                 
                 <div className="space-y-4 mb-8">
                     <div className="flex items-center gap-3 text-sm text-[var(--voyage-muted)]">
                         <Check className="h-4 w-4 text-green-500" />
                         <span>Instant delivery via Email</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm text-[var(--voyage-muted)]">
                         <Check className="h-4 w-4 text-green-500" />
                         <span>Quick QR code installation</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm text-[var(--voyage-muted)]">
                         <Check className="h-4 w-4 text-green-500" />
                         <span>Top-up available anytime</span>
                     </div>
                 </div>

                 <Button 
                    onClick={buyNow}
                    className="w-full h-14 text-lg font-bold bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white shadow-[0_0_20px_rgba(30,144,255,0.3)] transition-all"
                 >
                    Buy Now
                 </Button>
                 
                 <div className="mt-4 flex justify-center">
                     <div className="h-32 w-32 bg-white p-2 rounded-lg opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                         {/* Placeholder QR */}
                         <div className="h-full w-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example')] bg-cover" />
                     </div>
                 </div>
                 <p className="text-center text-xs text-[var(--voyage-muted)] mt-2">Scan to test compatibility</p>
             </div>
         </div>
      </div>
    </div>
  );
}
