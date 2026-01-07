"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Smartphone, Shield, Wifi, Globe, Download, AlertTriangle, X, ExternalLink, Wallet, CreditCard, ChevronRight, XCircle } from "lucide-react";
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
  // Guard against missing plan data
  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--voyage-muted)]">Plan not found</p>
      </div>
    );
  }
  
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
  const [activeTab, setActiveTab] = useState("coverage");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Check if this is an unlimited plan (2GB + FUP1Mbps)
  const isUnlimitedPlan = isDailyUnlimitedPlan(plan);
  
  // For unlimited plans, allow user to select duration (1-365 days)
  // For regular plans, use the plan's fixed duration
  const [selectedDays, setSelectedDays] = useState<number>(plan.duration || 1);
  
  // Calculate discounted price
  const planGB = calculateGB(plan.volume || 0);
  const discountPercent = getDiscount(plan.packageCode, planGB);
  const basePriceUSD = plan.price || 0;
  
  // For unlimited plans: plan.price is daily price, total = daily × selected days
  // For regular plans: plan.price is total price
  const dailyPriceUSD = isUnlimitedPlan ? basePriceUSD : (basePriceUSD / (plan.duration || 1));
  const totalPriceUSD = isUnlimitedPlan ? (dailyPriceUSD * selectedDays) : basePriceUSD;
  
  // Apply discount
  const discountedDailyPriceUSD = isUnlimitedPlan 
    ? calculateFinalPrice(dailyPriceUSD, discountPercent)
    : dailyPriceUSD;
  
  const finalPriceUSD = isUnlimitedPlan
    ? discountedDailyPriceUSD * selectedDays
    : calculateFinalPrice(totalPriceUSD, discountPercent);
  
  // Convert final discounted price to selected currency
  const convertedPrice = convert(finalPriceUSD);
  const priceUSDCents = Math.round(finalPriceUSD * 100);

  // Extract flags and get cleaned name
  const flagInfo = getPlanFlagLabels(plan);
  let displayName = flagInfo.cleanedName || plan.name || '';
  
  // Replace "2GB" with "Unlimited" for unlimited plans (2GB + FUP1Mbps)
  if (isUnlimitedPlan) {
    displayName = displayName
      .replace(/\b2gb\b/gi, 'Unlimited')
      .replace(/\b2\s*gb\b/gi, 'Unlimited')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Format plan title nicely - parse components and structure them better
  const formatPlanTitle = (name: string) => {
    if (!name) {
      return { country: '', data: '', duration: '', full: '' };
    }
    // Try multiple patterns to extract country, data, and duration
    // Pattern 1: "Malaysia 3GB 15Days" or "Malaysia 3GB/Day"
    let match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)\s*\/?\s*(\d+)\s*(Days?|Day)?/i);
    
    if (match) {
      const country = match[1].trim();
      const data = `${match[2]} ${match[3].toUpperCase()}`;
      const duration = match[4] ? `${match[4]} ${match[5] ? match[5] : 'Days'}` : '';
      
      return {
        country,
        data,
        duration,
        full: name,
      };
    }
    
    // Pattern 2: "Malaysia 3GB/Day" (with slash)
    match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)\/(Days?|Day)/i);
    if (match) {
      const country = match[1].trim();
      const data = `${match[2]} ${match[3].toUpperCase()}`;
      return {
        country,
        data,
        duration: `Per ${match[4]}`,
        full: name,
      };
    }
    
    // Pattern 3: "Malaysia 3GB 15 Days" (with space before Days)
    match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)\s+(\d+)\s+(Days?|Day)/i);
    if (match) {
      const country = match[1].trim();
      const data = `${match[2]} ${match[3].toUpperCase()}`;
      const duration = `${match[4]} ${match[5]}`;
      return {
        country,
        data,
        duration,
        full: name,
      };
    }
    
    // Pattern 4: Just country and data "Malaysia 3GB"
    match = name.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(GB|MB)$/i);
    if (match) {
      const country = match[1].trim();
      const data = `${match[2]} ${match[3].toUpperCase()}`;
      return {
        country,
        data,
        duration: '',
        full: name,
      };
    }
    
    // Fallback: return country name as-is, show rest below
    const parts = name.split(/\s+/);
    if (parts.length > 1) {
      const country = parts[0];
      const rest = parts.slice(1).join(' ');
      return { country, data: rest, duration: '', full: name };
    }
    
    // Final fallback
    return { country: name, data: '', duration: '', full: name };
  };

  const titleParts = useMemo(() => formatPlanTitle(displayName), [displayName]);

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
      
      // Always add user email header if logged in (for both Stripe and V-Cash)
      if (user?.primaryEmailAddress?.emailAddress) {
        headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
      }

      const requestBody: any = {
        planCode: plan.packageCode,
        currency: selectedCurrency,
        displayCurrency: selectedCurrency,
        amount: finalPriceUSD,  // Send final discounted USD price
        planName: displayName, // Use cleaned name without flags
        referralCode: referralCode || undefined, // Only include if exists
        paymentMethod: paymentMethod,
        // Include email in request body for pending order creation
        email: user?.primaryEmailAddress?.emailAddress || undefined,
        // For Unlimited/Day Pass plans, include selected duration
        ...(isUnlimitedPlan && { duration: selectedDays }),
      };

      // Debug logging
      console.log('[CHECKOUT] Request body:', requestBody);
      console.log('[CHECKOUT] Plan object:', { packageCode: plan.packageCode, name: displayName, price: plan.price });

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
      } else if (data.orderId) {
        // Stripe checkout - redirect to review page first
        router.push(`/checkout/${data.orderId}`);
      } else if (data.url) {
        // Fallback: Legacy flow - redirect directly to Stripe
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
        <div className="bg-[var(--voyage-card)]/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[var(--voyage-border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <Wifi className="h-64 w-64 text-[var(--voyage-accent)] rotate-12 transform scale-125" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center flex-wrap gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)] text-xs font-semibold tracking-normal border border-[var(--voyage-accent)]/20">
                        Data Only
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold tracking-normal border border-purple-500/20">
                        Instant eSIM
                    </span>
                    {/* IP Location Badge - moved to top */}
                    {flagInfo.ipType && (
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-normal border border-purple-500/30 hover:bg-purple-500/20">
                        {flagInfo.ipType.label}
                      </span>
                    )}
                </div>
                
                {/* Formatted Plan Title */}
                <div className="mb-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                    {titleParts.country}
                  </h1>
                  {(titleParts.data || titleParts.duration) && (
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                      {titleParts.data && (
                        <span className="text-xl md:text-2xl font-semibold text-[var(--voyage-accent)]">
                          {titleParts.data}
                        </span>
                      )}
                      {titleParts.duration && (
                        <span className="text-lg md:text-xl font-medium text-[var(--voyage-muted)]">
                          • {titleParts.duration}
                        </span>
                      )}
                    </div>
                  )}
                  {!titleParts.data && !titleParts.duration && titleParts.full !== titleParts.country && titleParts.full && titleParts.country && (
                    <div className="text-lg md:text-xl font-medium text-[var(--voyage-muted)] mt-1">
                      {titleParts.full.replace(titleParts.country, '').trim()}
                    </div>
                  )}
                </div>
                
                {/* FUP Badge only (IP location moved to top) */}
                {flagInfo.fup && (
                  <div className="mb-6">
                    <PlanFlags 
                      plan={plan} 
                      showIP={false} 
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[var(--voyage-muted)]">
                   <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--voyage-bg)]/50 border" style={{ borderColor: 'hsl(214.91deg 47.83% 22.55%)' }}>
                      <div className="p-2 bg-[var(--voyage-accent)]/10 rounded-full">
                        <Globe className="h-5 w-5 text-[var(--voyage-accent)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--voyage-muted)] uppercase tracking-wider font-semibold">Region</span>
                        {plan.location && typeof plan.location === 'string' && plan.location.includes(',') ? (
                          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                              <button className="text-white hover:text-[var(--voyage-accent)] transition-colors text-left font-medium flex items-center gap-1 group/btn">
                                {plan.location.split(',').filter((c: string) => c.trim()).length} Countries
                                <ChevronRight className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 transition-opacity -ml-1 group-hover/btn:ml-0" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--voyage-card)] border-[var(--voyage-border)] text-white">
                              <DialogHeader>
                                <DialogTitle>Covered Countries ({plan.location.split(',').filter((c: string) => c.trim()).length})</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                {plan.location.split(',').filter((c: string) => c.trim()).map((code: string) => {
                                  const cleanCode = code.trim();
                                  if (!cleanCode) return null;
                                  try {
                                    const countryCode = cleanCode.toLowerCase().split('-')[0];
                                    return (
                                      <div key={cleanCode} className="flex items-center gap-2 p-2 rounded bg-[var(--voyage-bg-light)]">
                                        <div className="h-5 w-5 rounded-full overflow-hidden relative flex-shrink-0">
                                          <FlagIcon 
                                            logoUrl={`https://flagcdn.com/w320/${countryCode}.png`} 
                                            alt={cleanCode} 
                                            className="h-full w-full object-cover" 
                                          />
                                        </div>
                                        <span className="text-sm truncate" title={getCountryName(cleanCode)}>
                                          {getCountryName(cleanCode)}
                                        </span>
                                      </div>
                                    );
                                  } catch (e) {
                                    return null;
                                  }
                                })}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : plan.location && typeof plan.location === 'string' ? (
                          <span className="text-white font-medium">{getCountryName(plan.location)}</span>
                        ) : (
                          <span className="text-white font-medium">N/A</span>
                        )}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--voyage-bg)]/50 border" style={{ borderColor: 'hsl(214.91deg 47.83% 22.55%)' }}>
                      <div className="p-2 bg-[var(--voyage-accent)]/10 rounded-full">
                        <Wifi className="h-5 w-5 text-[var(--voyage-accent)]" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs text-[var(--voyage-muted)] uppercase tracking-wider font-semibold">Network Speed</span>
                         <span className="text-white font-medium">{plan.speed || 'N/A'}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--voyage-border)]/50">
                  <Link href="/device-check" className="text-sm text-[var(--voyage-accent)] hover:text-white transition-colors inline-flex items-center gap-2 group/link">
                    <Smartphone className="h-4 w-4" />
                    <span>Check if your phone supports eSIM</span>
                    <ExternalLink className="h-3 w-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                  </Link>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-all hover:bg-[var(--voyage-bg-light)] group">
              <span className="text-[var(--voyage-muted)] text-xs uppercase tracking-wider font-semibold mb-2 group-hover:text-[var(--voyage-accent)] transition-colors">Data</span>
              <span className="text-3xl font-bold text-white">{isUnlimitedPlan ? "Unlimited" : `${sizeGB} GB`}</span>
           </div>
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-all hover:bg-[var(--voyage-bg-light)] group">
              <span className="text-[var(--voyage-muted)] text-xs uppercase tracking-wider font-semibold mb-2 group-hover:text-[var(--voyage-accent)] transition-colors">Validity</span>
              {isUnlimitedPlan ? (
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={selectedDays}
                    onChange={(e) => {
                      const days = Math.max(1, Math.min(365, parseInt(e.target.value) || 1));
                      setSelectedDays(days);
                    }}
                    className="text-3xl font-bold text-white text-center w-24 bg-transparent border-2 border-[var(--voyage-border)] rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--voyage-accent)]"
                  />
                  <div className="flex gap-1 flex-wrap justify-center mt-1">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setSelectedDays(days)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                          selectedDays === days
                            ? 'bg-[var(--voyage-accent)] text-white'
                            : 'bg-[var(--voyage-bg-light)] text-[var(--voyage-muted)] hover:bg-[var(--voyage-accent)]/20 hover:text-[var(--voyage-accent)]'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-3xl font-bold text-white">{plan.duration || 0} <span className="text-lg font-medium text-[var(--voyage-muted)]">Days</span></span>
              )}
           </div>
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-all hover:bg-[var(--voyage-bg-light)] group">
              <span className="text-[var(--voyage-muted)] text-xs uppercase tracking-wider font-semibold mb-2 group-hover:text-[var(--voyage-accent)] transition-colors">Type</span>
              <span className="text-xl font-bold text-white">Prepaid</span>
           </div>
           <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center hover:border-[var(--voyage-accent)]/50 transition-all hover:bg-[var(--voyage-bg-light)] group">
              <span className="text-[var(--voyage-muted)] text-xs uppercase tracking-wider font-semibold mb-2 group-hover:text-[var(--voyage-accent)] transition-colors">Activation</span>
              <span className="text-xl font-bold text-white">Automatic</span>
           </div>
        </div>

        {/* Info Tabs */}
        {plan && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-[var(--voyage-card)] border border-[var(--voyage-border)] p-1 rounded-xl grid grid-cols-2">
              <TabsTrigger 
                value="coverage"
                className="rounded-lg data-[state=active]:bg-[var(--voyage-accent)] data-[state=active]:text-white text-[var(--voyage-muted)]"
              >
                Coverage & Networks
              </TabsTrigger>
              <TabsTrigger 
                value="installation"
                className="rounded-lg data-[state=active]:bg-[var(--voyage-accent)] data-[state=active]:text-white text-[var(--voyage-muted)]"
              >
                Installation
              </TabsTrigger>
            </TabsList>

          <TabsContent value="coverage" className="mt-6 space-y-4">
            <div className="bg-[var(--voyage-card)] rounded-2xl p-8 border border-[var(--voyage-border)]">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Globe className="h-5 w-5 text-[var(--voyage-accent)]" />
                 Coverage & Networks
               </h3>
               {plan.locationNetworkList && plan.locationNetworkList.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {plan.locationNetworkList
                         .filter((net: any) => net?.locationCode) // Filter out entries without locationCode
                         .map((net: any, i: number) => {
                           const locationCode = net.locationCode || '';
                           const countryCode = locationCode.toLowerCase().split('-')[0];
                           return (
                             <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] hover:border-[var(--voyage-accent)]/30 transition-colors">
                               <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 rounded-lg overflow-hidden relative border-2 border-[var(--voyage-border)] shadow-md flex-shrink-0">
                                       <FlagIcon 
                                         logoUrl={`https://flagcdn.com/w320/${countryCode}.png`} 
                                         alt={locationCode} 
                                         className="h-full w-full object-cover" 
                                       />
                                   </div>
                                   <div>
                                     <span className="text-sm font-bold text-white block">{getCountryName(locationCode)}</span>
                                     <span className="text-xs text-[var(--voyage-muted)]">{getNetworkOperator(locationCode)}</span>
                                   </div>
                               </div>
                               <span className="text-xs font-bold px-2 py-1 rounded-md bg-[var(--voyage-bg)] text-[var(--voyage-accent)] border border-[var(--voyage-border)]">4G/LTE</span>
                           </div>
                           );
                         })}
                   </div>
               ) : (
                   <div className="flex items-center gap-4 p-6 bg-[var(--voyage-bg-light)] rounded-xl border border-[var(--voyage-border)]">
                      <div className="p-3 bg-[var(--voyage-bg)] rounded-full border border-[var(--voyage-border)]">
                        <Globe className="h-6 w-6 text-[var(--voyage-accent)]" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Multi-Country Coverage</h4>
                        <p className="text-sm text-[var(--voyage-muted)]">
                          This plan provides high-speed connectivity across {plan.location || 'multiple countries'}. Enjoy seamless switching between top-tier networks.
                        </p>
                      </div>
                   </div>
               )}
            </div>
          </TabsContent>

          <TabsContent value="installation" className="mt-6">
            <div className="bg-[var(--voyage-card)] rounded-2xl p-8 border border-[var(--voyage-border)]">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Smartphone className="h-5 w-5 text-[var(--voyage-accent)]" />
                 Installation Instructions
               </h3>
               <div className="space-y-6">
                 <div className="flex items-start gap-4">
                   <div className="h-8 w-8 rounded-full bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)] flex items-center justify-center font-bold border border-[var(--voyage-accent)]/20 flex-shrink-0">1</div>
                   <div>
                     <h4 className="text-white font-medium mb-1">Buy and Receive</h4>
                     <p className="text-sm text-[var(--voyage-muted)]">Purchase your plan and receive a QR code via email instantly.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="h-8 w-8 rounded-full bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)] flex items-center justify-center font-bold border border-[var(--voyage-accent)]/20 flex-shrink-0">2</div>
                   <div>
                     <h4 className="text-white font-medium mb-1">Scan QR Code</h4>
                      <p className="text-sm text-[var(--voyage-muted)]">Go to Settings &gt; Cellular &gt; Add eSIM and scan the QR code provided.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="h-8 w-8 rounded-full bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)] flex items-center justify-center font-bold border border-[var(--voyage-accent)]/20 flex-shrink-0">3</div>
                   <div>
                     <h4 className="text-white font-medium mb-1">Activate</h4>
                     <p className="text-sm text-[var(--voyage-muted)]">Turn on Data Roaming for the eSIM when you arrive at your destination.</p>
                   </div>
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-[var(--voyage-border)]/50">
                    <Link href="/device-check" className="text-sm text-[var(--voyage-accent)] hover:text-white transition-colors inline-flex items-center gap-2 group/link">
                      <Smartphone className="h-4 w-4" />
                      <span>Check compatible devices</span>
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                    </Link>
                 </div>
               </div>
            </div>
          </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Right Column: Checkout */}
      <div className="lg:col-span-1">
         <div className="sticky top-24 space-y-6">
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6 shadow-2xl shadow-black/40">
                 <div className="flex justify-between items-center mb-6 pb-6 border-b border-[var(--voyage-border)]">
                     <span className="text-[var(--voyage-muted)]">Total Price</span>
                    <div className="flex flex-col items-end">
                      {isUnlimitedPlan && (
                        <div className="text-xs text-[var(--voyage-muted)] mb-1">
                          {formatCurrency(convert(discountedDailyPriceUSD))}/day × {selectedDays} days
                        </div>
                      )}
                      {discountPercent > 0 && (
                        <span className="text-sm text-[var(--voyage-muted)] line-through mb-1">
                          {formatCurrency(convert(isUnlimitedPlan ? (dailyPriceUSD * selectedDays) : basePriceUSD))}
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
                     {/* Show top-up availability based on supportTopUpType */}
                     {/* supportTopUpType: 1 = Non-reloadable, 2 = Reloadable (top-upable) */}
                     {plan.supportTopUpType === 2 ? (
                         <div className="flex items-center gap-3 text-sm text-[var(--voyage-muted)]">
                             <Check className="h-4 w-4 text-green-500" />
                             <span>Top-up available anytime</span>
                         </div>
                     ) : plan.supportTopUpType === 1 ? (
                         <div className="flex items-center gap-3 text-sm text-[var(--voyage-muted)]">
                             <XCircle className="h-4 w-4 text-red-500" />
                             <span>Top-up not available</span>
                         </div>
                     ) : null}
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
