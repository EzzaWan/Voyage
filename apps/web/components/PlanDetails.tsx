"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Smartphone, Shield, Wifi, Globe, Download, AlertTriangle, X, ExternalLink, Wallet, CreditCard, ChevronRight, XCircle, Signal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "./PriceTag";
import { FlagIcon } from "./FlagIcon";
import { useCurrency } from "./providers/CurrencyProvider";
import { getStoredReferralCode } from "@/lib/referral";
import { getDiscount, fetchDiscounts } from "@/lib/admin-discounts";
import { calculateGB, calculateFinalPrice, isDailyUnlimitedPlan } from "@/lib/plan-utils";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getCountryName } from "@/lib/country-slugs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPlanFlagLabels } from "@/lib/plan-flags";
import { PlanFlags } from "./PlanFlags";
import { PriceComparison } from "./PriceComparison";
import { PlanTrustReviews } from "./PlanTrustReviews";

const getNetworkOperator = (locationCode: string | undefined | null) => {
  if (!locationCode) return "Best Available Network";
  
  try {
    const code = locationCode.split('-')[0].toUpperCase();
    const operators: Record<string, string> = {
      'US': 'AT&T / T-Mobile',
      'GB': 'O2 / Three / Vodafone',
      'FR': 'Orange / Bouygues / SFR',
      'DE': 'Telekom / Vodafone / O2',
      'ES': 'Movistar / Orange / Vodafone',
      'IT': 'TIM / Vodafone / Wind Tre',
      'JP': 'Softbank / KDDI / Docomo',
      'KR': 'SK Telecom / KT / LG U+',
      'CN': 'China Unicom / China Mobile',
      'HK': 'CSL / SmartTone / 3HK',
      'TW': 'Chunghwa / Taiwan Mobile',
      'SG': 'Singtel / Starhub / M1',
      'MY': 'Celcom / Digi / Maxis',
      'TH': 'AIS / DTAC / TrueMove',
      'ID': 'Telkomsel / XL Axiata',
      'VN': 'Viettel / Vinaphone',
      'PH': 'Globe / Smart',
      'AU': 'Telstra / Optus / Vodafone',
      'NZ': 'Spark / One NZ',
      'CA': 'Rogers / Bell / Telus',
      'TR': 'Turkcell / Vodafone / Turk Telekom',
      'AE': 'Etisalat / Du',
      'SA': 'STC / Mobily',
    };
    return operators[code] || "Best Available Network";
  } catch (error) {
    return "Best Available Network";
  }
};

export function PlanDetails({ plan }: { plan: any }) {
  if (!plan) return null;
  
  const { selectedCurrency, convert, formatCurrency } = useCurrency();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const sizeGB = ((plan.volume || 0) / 1024 / 1024 / 1024).toFixed(1);
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);
  const [deviceCompatibility, setDeviceCompatibility] = useState<any>(null);
  const [proceedWithCheckout, setProceedWithCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'vcash'>('stripe');
  const [vcashBalance, setVcashBalance] = useState<number | null>(null);
  const [loadingVCash, setLoadingVCash] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const isUnlimitedPlan = isDailyUnlimitedPlan(plan);
  const [selectedDays, setSelectedDays] = useState<number>(plan.duration || 1);
  
  const planGB = calculateGB(plan.volume || 0);
  const discountPercent = getDiscount(plan.packageCode, planGB);
  const basePriceUSD = plan.price || 0;
  
  const dailyPriceUSD = isUnlimitedPlan ? basePriceUSD : (basePriceUSD / (plan.duration || 1));
  const finalPriceUSD = isUnlimitedPlan
    ? (isUnlimitedPlan ? calculateFinalPrice(dailyPriceUSD, discountPercent) : dailyPriceUSD) * selectedDays
    : calculateFinalPrice(basePriceUSD, discountPercent);
  
  const convertedPrice = convert(finalPriceUSD);
  const priceUSDCents = Math.round(finalPriceUSD * 100);

  const flagInfo = getPlanFlagLabels(plan);
  let displayName = flagInfo.cleanedName || plan.name || '';
  
  if (isUnlimitedPlan) {
    displayName = displayName.replace(/\b2gb\b/gi, 'Unlimited').replace(/\b2\s*gb\b/gi, 'Unlimited').replace(/\s+/g, ' ').trim();
  }

  const formatPlanTitle = (name: string) => {
    if (!name) return { country: '', data: '', duration: '', full: '' };
    let match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)\s*\/?\s*(\d+)\s*(Days?|Day)?/i);
    if (match) return { country: match[1].trim(), data: `${match[2]} ${match[3].toUpperCase()}`, duration: match[4] ? `${match[4]} ${match[5] ? match[5] : 'Days'}` : '', full: name };
    match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)\/(Days?|Day)/i);
    if (match) return { country: match[1].trim(), data: `${match[2]} ${match[3].toUpperCase()}`, duration: `Per ${match[4]}`, full: name };
    match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)\s+(\d+)\s+(Days?|Day)/i);
    if (match) return { country: match[1].trim(), data: `${match[2]} ${match[3].toUpperCase()}`, duration: `${match[4]} ${match[5]}`, full: name };
    match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)$/i);
    if (match) return { country: match[1].trim(), data: `${match[2]} ${match[3].toUpperCase()}`, duration: '', full: name };
    const parts = name.split(/\s+/);
    if (parts.length > 1) return { country: parts[0], data: parts.slice(1).join(' '), duration: '', full: name };
    return { country: name, data: '', duration: '', full: name };
  };

  const titleParts = useMemo(() => formatPlanTitle(displayName), [displayName]);

  useEffect(() => { fetchDiscounts().catch(console.error); }, []);

  useEffect(() => {
    const checkDeviceCompatibility = async () => {
      const savedDevice = localStorage.getItem('deviceModel');
      if (!savedDevice) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any>(`${apiUrl}/device/check?model=${encodeURIComponent(savedDevice)}`, { showToast: false });
        if (!data.supported) setDeviceCompatibility(data);
      } catch (error) { console.error("Failed to check device compatibility:", error); }
    };
    checkDeviceCompatibility();
  }, []);

  useEffect(() => {
    if (!userLoaded || !user) { setVcashBalance(null); return; }
    const fetchVCashBalance = async () => {
      setLoadingVCash(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) { setLoadingVCash(false); return; }
        const data = await safeFetch<{ balanceCents: number }>(`${apiUrl}/vcash`, { headers: { 'x-user-email': userEmail }, showToast: false });
        setVcashBalance(data.balanceCents);
      } catch (error) { setVcashBalance(null); } finally { setLoadingVCash(false); }
    };
    fetchVCashBalance();
  }, [userLoaded, user]);

  async function buyNow() {
    if (paymentMethod === 'vcash' && (!userLoaded || !user)) {
      toast({ title: "Sign in required", description: "Please sign in to use V-Cash.", variant: "destructive" });
      return;
    }
    const savedDevice = localStorage.getItem('deviceModel');
    if (savedDevice && deviceCompatibility && !deviceCompatibility.supported && !proceedWithCheckout) {
      setShowDeviceWarning(true);
      return;
    }
    if (paymentMethod === 'vcash' && (vcashBalance === null || vcashBalance < priceUSDCents)) {
      toast({ title: "Insufficient V-Cash", description: `You need more V-Cash.`, variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const referralCode = getStoredReferralCode();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.primaryEmailAddress?.emailAddress) headers['x-user-email'] = user.primaryEmailAddress.emailAddress;

      const requestBody: any = {
        planCode: plan.packageCode,
        currency: selectedCurrency,
        displayCurrency: selectedCurrency,
        amount: finalPriceUSD,
        planName: displayName,
        referralCode: referralCode || undefined,
        paymentMethod: paymentMethod,
        email: user?.primaryEmailAddress?.emailAddress || undefined,
        ...(isUnlimitedPlan && { duration: selectedDays }),
      };

      const data = await safeFetch<{ url?: string; success?: boolean; orderId?: string }>(`${apiUrl}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        errorMessage: "Failed to start checkout.",
      });

      if (paymentMethod === 'vcash' && data.success) {
        toast({ title: "Order placed!", description: "Paid with V-Cash." });
        if (user?.primaryEmailAddress?.emailAddress) {
           // refresh balance...
        }
        router.push('/my-esims');
      } else if (data.orderId) {
        router.push(`/checkout/${data.orderId}`);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ title: "Checkout failed", description: error.message || "Failed to start checkout.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      {/* Left Column - Main Modal */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-8 shadow-xl space-y-10">
            
            {/* Header Section */}
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                    {titleParts.country} {titleParts.data} {titleParts.duration}
                </h1>
                
                {/* Features (replacing badges) */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--voyage-muted)]">
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Instant delivery via Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Quick QR code installation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Top-up available anytime</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid - 4 distinct boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox 
                    label="Total Data" 
                    value={isUnlimitedPlan ? "Unlimited" : `${sizeGB} GB`} 
                />
                <StatBox 
                    label="Duration" 
                    value={
                        isUnlimitedPlan ? (
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={selectedDays}
                                    onChange={(e) => setSelectedDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                                    className="text-xl font-bold text-white w-12 bg-transparent border-b border-white/20 text-center focus:outline-none p-0 h-6"
                                />
                                <span className="text-xs text-[var(--voyage-muted)] mt-1">Days</span>
                            </div>
                        ) : (
                            `${plan.duration || 0} Days`
                        )
                    } 
                />
                <StatBox 
                    label="Speed" 
                    value={plan.speed || "4G/LTE"} 
                />
                <StatBox 
                    label="Activation" 
                    value="Automatic" 
                />
            </div>

            {/* Coverage Region */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-[var(--voyage-muted)] uppercase tracking-wider text-xs font-bold">
                    <Globe className="h-4 w-4" />
                    <span>Coverage Region</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    {plan.location && typeof plan.location === 'string' && plan.location.includes(',') ? (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-3 bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-lg p-3 hover:bg-[var(--voyage-bg-light)] transition-colors text-left group">
                                    <div className="h-8 w-8 bg-[var(--voyage-bg-light)] rounded-full flex items-center justify-center border border-[var(--voyage-border)] group-hover:border-[var(--voyage-accent)]/50 transition-colors">
                                        <span className="text-xs font-bold text-white">+{plan.location.split(',').length}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-[var(--voyage-accent)] transition-colors">Multiple Countries</div>
                                        <div className="text-[10px] text-[var(--voyage-muted)]">Click to view all</div>
                                    </div>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="bg-[var(--voyage-card)] border-[var(--voyage-border)] text-white">
                                <DialogHeader><DialogTitle>Covered Countries</DialogTitle></DialogHeader>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {plan.location.split(',').filter((c: string) => c.trim()).map((code: string) => (
                                        <div key={code} className="flex items-center gap-2 p-2 bg-[var(--voyage-bg-light)] rounded">
                                            <FlagIcon logoUrl={`https://flagcdn.com/w320/${code.trim().toLowerCase().split('-')[0]}.png`} alt={code} className="h-4 w-6 rounded-sm object-cover" />
                                            <span className="text-sm">{getCountryName(code.trim())}</span>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="flex items-center gap-3 bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-lg p-3 pr-6">
                            <div className="h-8 w-10 rounded-sm overflow-hidden relative shadow-sm">
                                <FlagIcon logoUrl={`https://flagcdn.com/w320/${plan.location?.toLowerCase().split('-')[0]}.png`} alt={plan.location} className="h-full w-full object-cover" />
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wide">{getCountryName(plan.location)}</span>
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* Price Comparison */}
        <PriceComparison />
        
        {/* Customer Reviews */}
        <PlanTrustReviews planId={plan.packageCode || plan.id || 'global'} />
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1 space-y-6">
         {/* Checkout Card */}
         <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6 shadow-xl sticky top-24">
             <div className="mb-6 pb-6 border-b border-[var(--voyage-border)]">
                 <h3 className="text-[var(--voyage-muted)] text-xs uppercase tracking-wider font-semibold mb-4 text-center">Order Summary</h3>
                 
                 <div className="space-y-3 mb-6">
                     <div className="flex justify-between text-sm">
                         <span className="text-[var(--voyage-muted)]">Item:</span>
                         <span className="text-white font-medium text-right max-w-[60%]">{titleParts.country} {titleParts.data} {titleParts.duration}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-[var(--voyage-muted)]">Data:</span>
                         <span className="text-white font-medium">{isUnlimitedPlan ? "Unlimited" : `${sizeGB} GB`}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-[var(--voyage-muted)]">Validity:</span>
                         <span className="text-white font-medium">{isUnlimitedPlan ? `${selectedDays} Days` : `${plan.duration} Days`}</span>
                     </div>
                 </div>

                 {discountPercent > 0 && (
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--voyage-muted)] line-through">
                            {formatCurrency(convert(isUnlimitedPlan ? (dailyPriceUSD * selectedDays) : basePriceUSD))}
                        </span>
                    </div>
                 )}
                 
                 <div className="flex justify-between items-end">
                     <span className="text-xl font-bold text-white">TOTAL:</span>
                     <div className="text-right">
                         <span className="text-3xl font-bold text-white">{formatCurrency(convertedPrice)}</span>
                         {discountPercent > 0 && <div className="text-[10px] text-[var(--voyage-accent)] font-bold mt-1 uppercase tracking-wider">{discountPercent}% Savings Applied</div>}
                     </div>
                 </div>
             </div>

             {/* Payment Method */}
             {userLoaded && user && vcashBalance !== null && vcashBalance > 0 && (
                 <div className="grid grid-cols-2 gap-2 mb-6">
                     <button onClick={() => setPaymentMethod('vcash')} className={`py-2 text-xs font-bold rounded-full border transition-all ${paymentMethod === 'vcash' ? 'bg-[var(--voyage-accent)] text-white border-transparent' : 'bg-transparent text-[var(--voyage-muted)] border-[var(--voyage-border)]'}`}>Pay w/ V-Cash</button>
                     <button onClick={() => setPaymentMethod('stripe')} className={`py-2 text-xs font-bold rounded-full border transition-all ${paymentMethod === 'stripe' ? 'bg-[var(--voyage-accent)] text-white border-transparent' : 'bg-transparent text-[var(--voyage-muted)] border-[var(--voyage-border)]'}`}>Pay w/ Card</button>
                 </div>
             )}

             <Button 
                onClick={buyNow}
                disabled={processing}
                className="w-full h-14 text-lg font-bold bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white uppercase tracking-wider shadow-lg shadow-blue-500/20"
             >
                {processing ? 'Processing...' : 'Complete Order'}
             </Button>
             
             <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[var(--voyage-muted)]">
                 <Shield className="h-3 w-3" />
                 <span>Secure Checkout • Instant Delivery</span>
             </div>
         </div>

         {/* Device Compatibility Link */}
         <Link href="/device-check" className="block bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-4 hover:border-[var(--voyage-accent)] transition-colors group">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-[var(--voyage-bg-light)] flex items-center justify-center text-[var(--voyage-muted)] group-hover:text-white transition-colors">
                         <Smartphone className="h-4 w-4" />
                     </div>
                     <div>
                         <div className="text-sm font-bold text-white">Device Compatibility</div>
                         <div className="text-[10px] text-[var(--voyage-muted)]">Check if your phone works</div>
                     </div>
                 </div>
                 <ChevronRight className="h-4 w-4 text-[var(--voyage-muted)] group-hover:translate-x-1 transition-transform" />
             </div>
         </Link>
      </div>

      {/* Warning Modal */}
      {showDeviceWarning && deviceCompatibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
             <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><AlertTriangle className="text-yellow-400" /> Warning</h3>
                <p className="text-[var(--voyage-muted)]">Your device may not be supported.</p>
             </div>
             <div className="flex gap-3">
                <Button onClick={() => { setShowDeviceWarning(false); setProceedWithCheckout(true); buyNow(); }} variant="destructive" className="flex-1">Continue</Button>
                <Button onClick={() => setShowDeviceWarning(false)} variant="outline" className="flex-1 border-[var(--voyage-border)] text-white">Cancel</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className="bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-xl p-4 flex flex-col items-center justify-center text-center h-28 hover:border-[var(--voyage-accent)]/30 transition-colors">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--voyage-muted)] mb-2">{label}</span>
            <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
