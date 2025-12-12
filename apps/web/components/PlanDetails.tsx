"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Smartphone, Shield, Wifi, Globe, Download, AlertTriangle, X, ExternalLink, Wallet, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "./PriceTag";
import { FlagIcon } from "./FlagIcon";
import { useCurrency } from "./providers/CurrencyProvider";
import { getStoredReferralCode } from "@/lib/referral";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";
import { calculateGB, calculateFinalPrice } from "@/lib/plan-utils";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getCountryName } from "@/lib/country-slugs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PlanDetails({ plan }: { plan: any }) {
  console.log("PLAN DEBUG:", plan);
  const { selectedCurrency, convert, formatCurrency } = useCurrency();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const sizeGB = (plan.volume / 1024 / 1024 / 1024).toFixed(1);
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);
  const [deviceCompatibility, setDeviceCompatibility] = useState<any>(null);
  const [proceedWithCheckout, setProceedWithCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'vcash'>('stripe');
  const [vcashBalance, setVcashBalance] = useState<number | null>(null);
  const [loadingVCash, setLoadingVCash] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Calculate discounted price
  const planGB = calculateGB(plan.volume || 0);
  const discountPercent = getDiscount(plan.packageCode, planGB);
  const basePriceUSD = plan.price || 0;
  const finalPriceUSD = calculateFinalPrice(basePriceUSD, discountPercent);
  
  // Convert final discounted price to selected currency
  const convertedPrice = convert(finalPriceUSD);
  const priceUSDCents = Math.round(finalPriceUSD * 100);

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts().catch(console.error);
  }, []);

  // Check device compatibility on mount and before checkout
  useEffect(() => {
    const checkDeviceCompatibility = async () => {
      const savedDevice = localStorage.getItem('deviceModel');
      if (!savedDevice) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any>(`${apiUrl}/device/check?model=${encodeURIComponent(savedDevice)}`, { showToast: false });
        if (!data.supported) {
          setDeviceCompatibility(data);
        }
      } catch (error) {
        console.error("Failed to check device compatibility:", error);
      }
    };

    checkDeviceCompatibility();
  }, []);

  // Fetch V-Cash balance when user is loaded and signed in
  useEffect(() => {
    if (!userLoaded || !user) {
      setVcashBalance(null);
      return;
    }

    const fetchVCashBalance = async () => {
      setLoadingVCash(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setLoadingVCash(false);
          return;
        }

        const data = await safeFetch<{ balanceCents: number }>(`${apiUrl}/vcash`, {
          headers: {
            'x-user-email': userEmail,
          },
          showToast: false,
        });
        setVcashBalance(data.balanceCents);
      } catch (error) {
        console.error("Failed to fetch V-Cash balance:", error);
        setVcashBalance(null);
      } finally {
        setLoadingVCash(false);
      }
    };

    fetchVCashBalance();
  }, [userLoaded, user]);

  async function buyNow() {
    // Check if user is signed in for V-Cash payment
    if (paymentMethod === 'vcash' && (!userLoaded || !user)) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use V-Cash for payment.",
        variant: "destructive",
      });
      return;
    }

    // Check device compatibility before proceeding
    const savedDevice = localStorage.getItem('deviceModel');
    if (savedDevice && deviceCompatibility && !deviceCompatibility.supported && !proceedWithCheckout) {
      setShowDeviceWarning(true);
      return;
    }

    // Check V-Cash balance if using V-Cash
    if (paymentMethod === 'vcash') {
      if (vcashBalance === null || vcashBalance < priceUSDCents) {
        toast({
          title: "Insufficient V-Cash",
          description: `You need $${(priceUSDCents / 100).toFixed(2)} but only have $${vcashBalance ? (vcashBalance / 100).toFixed(2) : '0.00'} in V-Cash.`,
          variant: "destructive",
        });
        return;
      }
    }

    setProcessing(true);
    console.log("FRONT price dollars:", plan.price);
    try {
      // Get referral code if available
      const referralCode = getStoredReferralCode();
      console.log('[CHECKOUT] Referral code from cookie:', referralCode || 'none');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      
      // Add user email header for V-Cash payments
      if (paymentMethod === 'vcash' && user?.primaryEmailAddress?.emailAddress) {
        headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
      }

      const requestBody: any = {
        planCode: plan.packageCode,
        currency: selectedCurrency,
        displayCurrency: selectedCurrency,
        amount: finalPriceUSD,  // Send final discounted USD price
        planName: plan.name,
        referralCode: referralCode || undefined, // Only include if exists
        paymentMethod: paymentMethod,
      };

      // Debug logging
      console.log('[CHECKOUT] Request body:', requestBody);
      console.log('[CHECKOUT] Plan object:', { packageCode: plan.packageCode, name: plan.name, price: plan.price });

      const data = await safeFetch<{ url?: string; success?: boolean; orderId?: string; message?: string }>(
        `${apiUrl}/orders`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
          errorMessage: "Failed to start checkout. Please try again.",
        }
      );

      if (paymentMethod === 'vcash' && data.success) {
        // V-Cash payment successful - redirect to order confirmation
        toast({
          title: "Order placed successfully!",
          description: "Your order has been placed using V-Cash.",
        });
        
        // Refresh V-Cash balance
        if (user?.primaryEmailAddress?.emailAddress) {
          const balanceData = await safeFetch<{ balanceCents: number }>(`${apiUrl}/vcash`, {
            headers: {
              'x-user-email': user.primaryEmailAddress.emailAddress,
            },
            showToast: false,
          });
          setVcashBalance(balanceData.balanceCents);
        }

        // Redirect to my-esims or order confirmation
        router.push('/my-esims');
      } else if (data.url) {
        // Stripe checkout - redirect to Stripe
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        code: error.code,
        cause: error.cause,
      });
      toast({
        title: "Checkout failed",
        description: error.message || error.cause?.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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
                      {plan.location && plan.location.includes(',') ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="hover:text-white hover:underline focus:outline-none transition-colors text-left">
                              {plan.location.split(',').length} Countries Region
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--voyage-card)] border-[var(--voyage-border)] text-white">
                            <DialogHeader>
                              <DialogTitle>Covered Countries ({plan.location.split(',').length})</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                              {plan.location.split(',').map((code: string) => {
                                const cleanCode = code.trim();
                                return (
                                  <div key={cleanCode} className="flex items-center gap-2 p-2 rounded bg-[var(--voyage-bg-light)]">
                                    <div className="h-5 w-5 rounded-full overflow-hidden relative flex-shrink-0">
                                      <FlagIcon 
                                        logoUrl={`https://flagcdn.com/w320/${cleanCode.toLowerCase().split('-')[0]}.png`} 
                                        alt={cleanCode} 
                                        className="h-full w-full object-cover" 
                                      />
                                    </div>
                                    <span className="text-sm truncate" title={getCountryName(cleanCode)}>
                                      {getCountryName(cleanCode)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span>{getCountryName(plan.location)} Region</span>
                      )}
                   </div>
                   <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-[var(--voyage-accent)]" />
                      <span>{plan.speed} Speed</span>
                   </div>
                </div>
                <div className="mt-4">
                  <Link href="/device-check" className="text-sm text-[var(--voyage-accent)] hover:underline transition-colors inline-flex items-center gap-1">
                    Check if your phone supports eSIM
                    <ExternalLink className="h-3 w-3" />
                  </Link>
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
                               <div className="h-8 w-8 rounded-full overflow-hidden relative border border-[var(--voyage-border)] flex-shrink-0">
                                   <FlagIcon 
                                     logoUrl={`https://flagcdn.com/w320/${net.locationCode.toLowerCase().split('-')[0]}.png`} 
                                     alt={net.locationCode} 
                                     className="h-full w-full object-cover" 
                                   />
                               </div>
                               <span className="text-sm font-medium text-white">{getCountryName(net.locationCode)}</span>
                           </div>
                           <span className="text-xs font-medium px-2 py-1 rounded bg-[var(--voyage-card)] text-[var(--voyage-muted)] border border-[var(--voyage-border)]">4G/LTE</span>
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
                    <div className="flex flex-col items-end">
                      {discountPercent > 0 && (
                        <span className="text-sm text-[var(--voyage-muted)] line-through mb-1">
                          {formatCurrency(convert(basePriceUSD))}
                        </span>
                      )}
                      <span className="text-4xl text-white font-bold">
                        {formatCurrency(convertedPrice)}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-sm text-[var(--voyage-accent)] mt-1">
                          {discountPercent}% off
                        </span>
                      )}
                    </div>
                 </div>

                 {/* V-Cash Balance Display (if signed in) */}
                 {userLoaded && user && (
                   <div className="mb-6 p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <Wallet className="h-4 w-4 text-[var(--voyage-accent)]" />
                         <span className="text-sm text-[var(--voyage-muted)]">V-Cash Balance</span>
                       </div>
                       {loadingVCash ? (
                         <span className="text-sm text-[var(--voyage-muted)]">Loading...</span>
                       ) : (
                         <span className="text-lg font-bold text-white">
                           ${vcashBalance !== null ? (vcashBalance / 100).toFixed(2) : '0.00'}
                         </span>
                       )}
                     </div>
                     {vcashBalance !== null && vcashBalance >= priceUSDCents && (
                       <p className="text-xs text-green-400 mt-1">
                         ✓ Sufficient balance for this purchase
                       </p>
                     )}
                     {vcashBalance !== null && vcashBalance < priceUSDCents && (
                       <p className="text-xs text-yellow-400 mt-1">
                         ⚠ You need ${((priceUSDCents - vcashBalance) / 100).toFixed(2)} more
                       </p>
                     )}
                   </div>
                 )}

                 {/* Payment Method Selection (if signed in with V-Cash balance) */}
                 {userLoaded && user && vcashBalance !== null && vcashBalance > 0 && (
                   <div className="mb-6">
                     <label className="text-sm font-medium text-white mb-3 block">Payment Method</label>
                     <div className="grid grid-cols-2 gap-3">
                       <button
                         onClick={() => setPaymentMethod('vcash')}
                         disabled={vcashBalance < priceUSDCents}
                         className={`p-3 rounded-lg border-2 transition-all ${
                           paymentMethod === 'vcash'
                             ? 'border-[var(--voyage-accent)] bg-[var(--voyage-accent)]/10'
                             : 'border-[var(--voyage-border)] hover:border-[var(--voyage-accent)]/50'
                         } ${vcashBalance < priceUSDCents ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                       >
                         <Wallet className="h-5 w-5 mx-auto mb-2 text-[var(--voyage-accent)]" />
                         <div className="text-xs font-medium text-white">V-Cash</div>
                         {vcashBalance < priceUSDCents && (
                           <div className="text-xs text-yellow-400 mt-1">Insufficient</div>
                         )}
                       </button>
                       <button
                         onClick={() => setPaymentMethod('stripe')}
                         className={`p-3 rounded-lg border-2 transition-all ${
                           paymentMethod === 'stripe'
                             ? 'border-[var(--voyage-accent)] bg-[var(--voyage-accent)]/10'
                             : 'border-[var(--voyage-border)] hover:border-[var(--voyage-accent)]/50'
                         } cursor-pointer`}
                       >
                         <CreditCard className="h-5 w-5 mx-auto mb-2 text-[var(--voyage-accent)]" />
                         <div className="text-xs font-medium text-white">Card</div>
                       </button>
                     </div>
                   </div>
                 )}
                 
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
                    disabled={processing || (paymentMethod === 'vcash' && vcashBalance !== null && vcashBalance < priceUSDCents)}
                    className="w-full h-14 text-lg font-bold bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white shadow-[0_0_20px_rgba(30,144,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {processing ? 'Processing...' : paymentMethod === 'vcash' ? 'Pay with V-Cash' : 'Buy Now'}
                 </Button>
             </div>
         </div>
      </div>

      {/* Device Warning Modal */}
      {showDeviceWarning && deviceCompatibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Device Compatibility Warning</h3>
              </div>
              <button
                onClick={() => setShowDeviceWarning(false)}
                className="text-[var(--voyage-muted)] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-[var(--voyage-muted)] mb-2">
                Your device <span className="text-white font-semibold">{deviceCompatibility.brand} {deviceCompatibility.model}</span> may not support eSIM.
              </p>
              {deviceCompatibility.notes && deviceCompatibility.notes.length > 0 && (
                <div className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-md p-3 mt-3">
                  <ul className="list-disc list-inside text-sm text-[var(--voyage-muted)] space-y-1">
                    {deviceCompatibility.notes.map((note: string, idx: number) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeviceWarning(false);
                  setProceedWithCheckout(true);
                  buyNow();
                }}
                variant="destructive"
                className="flex-1"
              >
                Continue Anyway
              </Button>
              <Link href="/device-check" className="flex-1">
                <Button variant="outline" className="w-full border-[var(--voyage-border)] text-white hover:bg-[var(--voyage-bg-light)]">
                  Check Compatibility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
