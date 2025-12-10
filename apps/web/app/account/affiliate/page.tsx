"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle2, Users, DollarSign, ShoppingCart, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderStatusDisplay, getTopUpStatusDisplay } from "@/lib/admin-helpers";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";

interface AffiliateDashboard {
  affiliate: {
    id: string;
    referralCode: string;
    referralLink: string;
    totalCommission: number;
    isFrozen: boolean;
    createdAt: string;
  };
  stats: {
    totalCommission: number;
    totalReferrals: number;
    totalPurchases: number;
    totalCommissions: number;
  };
  balances: {
    pendingBalance: number;
    availableBalance: number;
    lifetimeTotal: number;
  };
  payoutMethod: any;
  payoutHistory: any[];
  remainingCommission: number; // Commission available to convert (total - paid out)
  referrals: Array<{
    id: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      joinedAt: string;
    };
    createdAt: string;
    orders: Array<{
      id: string;
      amountCents: number;
      displayCurrency?: string | null;
      displayAmountCents?: number | null;
      status: string;
      createdAt: string;
    }>;
    topups: Array<{
      id: string;
      amountCents: number;
      displayCurrency?: string | null;
      displayAmountCents?: number | null;
      status: string;
      createdAt: string;
    }>;
  }>;
  commissions: Array<{
    id: string;
    orderId: string;
    orderType: string;
    amountCents: number;
    createdAt: string;
  }>;
  recentPurchases: Array<{
    type: "order" | "topup";
    id: string;
    userEmail: string;
    userName: string | null;
    amountCents: number;
    displayCurrency?: string | null;
    displayAmountCents?: number | null;
    status: string;
    createdAt: string;
  }>;
}

export default function AffiliateDashboardPage() {
  const { user, isLoaded } = useUser();
  const { selectedCurrency, convert, formatCurrency: formatCurrencyContext, loading: currencyLoading } = useCurrency();
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submittingCashOut, setSubmittingCashOut] = useState(false);
  const [convertingToVCash, setConvertingToVCash] = useState(false);
  const [vcashAmount, setVcashAmount] = useState("");
  const [cashOutForm, setCashOutForm] = useState({
    paymentMethod: "",
    affiliateCode: "",
    amount: "",
  });

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any>(`${apiUrl}/affiliate/dashboard`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        
        if (cancelled) return;
        
        // Ensure arrays exist and remainingCommission has a default
        const safeData = {
          ...data,
          affiliate: data?.affiliate || null,
          referrals: Array.isArray(data?.referrals) ? data.referrals : [],
          commissions: Array.isArray(data?.commissions) ? data.commissions : [],
          recentPurchases: Array.isArray(data?.recentPurchases) ? data.recentPurchases : [],
          remainingCommission: typeof data?.remainingCommission === 'number' ? data.remainingCommission : 0,
          balances: data?.balances || { pendingBalance: 0, availableBalance: 0, lifetimeTotal: 0 },
          stats: data?.stats || { totalCommission: 0, totalReferrals: 0, totalPurchases: 0, totalCommissions: 0 },
          payoutMethod: data?.payoutMethod || null,
          payoutHistory: Array.isArray(data?.payoutHistory) ? data.payoutHistory : [],
        };
        
        if (!cancelled) {
          setDashboard(safeData);
        }
      } catch (error) {
        console.error("Failed to fetch affiliate dashboard:", error);
        if (!cancelled) {
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    
    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoaded]); // Use user?.id instead of entire user object

  const copyReferralLink = async () => {
    if (!dashboard?.affiliate?.referralLink) return;

    try {
      await navigator.clipboard.writeText(dashboard.affiliate.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Format currency: use actual payment currency if available, otherwise convert from USD
  // Memoize to prevent infinite re-renders - use stable references
  const formatCurrency = useCallback((
    centsUSD: number,
    displayCurrency?: string | null,
    displayAmountCents?: number | null
  ) => {
    try {
      // If we have the actual payment currency and amount, use that
      if (displayCurrency && displayAmountCents) {
        const currencyCode = displayCurrency.toUpperCase();
        const amount = displayAmountCents / 100;
        
        try {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode.toLowerCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(amount);
        } catch (error) {
          return `${currencyCode} ${amount.toFixed(2)}`;
        }
      }
      
      // Fallback: convert from USD cents to viewer's selected currency
      if (!centsUSD || isNaN(centsUSD) || centsUSD === 0) {
        return formatCurrencyContext ? formatCurrencyContext(0) : '$0.00';
      }
      const amountUSD = centsUSD / 100;
      const convertedAmount = convert ? convert(amountUSD) : amountUSD;
      return formatCurrencyContext ? formatCurrencyContext(convertedAmount) : `$${convertedAmount.toFixed(2)}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00';
    }
  }, [convert, formatCurrencyContext]);

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return '';
    }
  }, []);

  if (!isLoaded || loading || currencyLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Please sign in</h1>
        <p className="text-[var(--voyage-muted)]">You must be signed in to access the affiliate dashboard.</p>
      </div>
    );
  }

  if (!dashboard || !dashboard.affiliate) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          {loading ? 'Loading dashboard...' : 'Failed to load dashboard'}
        </h1>
        <p className="text-[var(--voyage-muted)]">
          {loading ? 'Please wait...' : 'Please try refreshing the page.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/account"
        className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Account
      </Link>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Affiliate Dashboard</h1>
          <p className="text-[var(--voyage-muted)]">Earn 10% lifetime commissions on all referrals</p>
        </div>
      </div>

      {/* Top Section: Referral Link & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referral Link Card */}
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] h-full">
          <CardHeader>
            <CardTitle className="text-white">Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/3 p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
                <p className="text-xs text-[var(--voyage-muted)] mb-1">Referral Code</p>
                <p className="text-xl font-bold text-white font-mono break-all">{dashboard?.affiliate?.referralCode || 'N/A'}</p>
              </div>
              <div className="w-full sm:w-2/3 p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
                <p className="text-xs text-[var(--voyage-muted)] mb-1">Referral Link</p>
                <p className="text-sm text-white break-all">{dashboard?.affiliate?.referralLink || 'N/A'}</p>
              </div>
            </div>
            <Button
              onClick={copyReferralLink}
              className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" /> Copy Referral Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] flex flex-col justify-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--voyage-muted)] mb-1">Total Commission</p>
                  <p className="text-2xl font-bold text-[var(--voyage-accent)]">
                    {formatCurrency(dashboard?.stats?.totalCommission || 0)}
                  </p>
                  <p className="text-xs text-[var(--voyage-muted)] mt-1">All-time earnings</p>
                </div>
                <DollarSign className="h-8 w-8 text-[var(--voyage-accent)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] flex flex-col justify-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--voyage-muted)] mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboard?.stats?.totalReferrals || 0}
                  </p>
                  <p className="text-xs text-[var(--voyage-muted)] mt-1">Users referred</p>
                </div>
                <Users className="h-8 w-8 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions Section: Convert & Cash Out */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Convert to V-Cash Section */}
        {dashboard?.remainingCommission !== undefined && dashboard.remainingCommission > 0 ? (
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] h-full">
            <CardHeader>
              <CardTitle className="text-white">Convert to V-Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--voyage-muted)] mb-4">
                Convert your affiliate earnings into V-Cash (store credit). V-Cash can be used on future Voyage purchases.
              </p>
              <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg mb-4">
                <p className="text-sm text-[var(--voyage-muted)]">Available to convert:</p>
                <p className="text-xl font-bold text-[var(--voyage-accent)]">
                  {formatCurrency(dashboard?.remainingCommission || 0)}
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user || convertingToVCash || dashboard?.affiliate?.isFrozen) return;

                  const amountNum = Math.round(parseFloat(vcashAmount) * 100); // Convert to cents
                  if (!vcashAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
                    toast({
                      title: "Error",
                      description: "Please enter a valid amount",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (amountNum > (dashboard?.remainingCommission || 0)) {
                    toast({
                      title: "Error",
                      description: `Amount exceeds available commission. Maximum: ${formatCurrency(dashboard?.remainingCommission || 0)}`,
                      variant: "destructive",
                    });
                    return;
                  }

                  setConvertingToVCash(true);
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                    const result = await safeFetch<{
                      success: boolean;
                      convertedAmountCents: number;
                      remainingCommissionCents: number;
                      vcashBalanceCents: number;
                    }>(`${apiUrl}/affiliate/vcash/convert`, {
                      method: "POST",
                      headers: {
                        "x-user-email": user.primaryEmailAddress?.emailAddress || "",
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ amountCents: amountNum }),
                    });

                    toast({
                      title: "Success",
                      description: `Converted ${formatCurrency(result.convertedAmountCents)} to V-Cash successfully.`,
                    });

                    setVcashAmount("");
                    
                    // Refresh dashboard data
                    window.location.reload();
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to convert to V-Cash",
                      variant: "destructive",
                    });
                  } finally {
                    setConvertingToVCash(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="vcashAmount" className="text-white">
                    Amount (USD)
                  </Label>
                  <Input
                    id="vcashAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={`Max: ${formatCurrency(dashboard?.remainingCommission || 0)}`}
                    value={vcashAmount}
                    onChange={(e) => setVcashAmount(e.target.value)}
                    className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white placeholder:text-[var(--voyage-muted)]"
                    disabled={convertingToVCash || dashboard?.affiliate?.isFrozen}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
                  disabled={convertingToVCash || dashboard.affiliate?.isFrozen}
                >
                  {convertingToVCash ? "Converting..." : "Convert to V-Cash"}
                </Button>
                <Link href="/account/vcash">
                  <Button variant="link" className="text-[var(--voyage-accent)] w-full">
                    View V-Cash Balance →
                  </Button>
                </Link>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] h-full flex items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <p className="text-[var(--voyage-muted)]">
                You need commission earnings to convert to V-Cash.
              </p>
              <Link href="/account/vcash">
                <Button variant="link" className="text-[var(--voyage-accent)]">
                  View V-Cash Balance →
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Cash-Out Request Form */}
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] h-full">
          <CardHeader>
            <CardTitle className="text-white">Request Cash Out</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.affiliate?.isFrozen && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-red-400 font-bold text-lg mb-2">⚠️ Account Frozen</p>
                    <p className="text-sm text-red-300 mb-2">
                      Your affiliate account has been temporarily frozen due to suspicious activity detected by our fraud detection system.
                    </p>
                    <p className="text-sm text-red-300 mb-3">
                      While your account is frozen:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-300 space-y-1 ml-2">
                      <li>You cannot request payouts</li>
                      <li>You cannot convert commissions to V-Cash</li>
                      <li>New commissions will still accrue but remain pending</li>
                    </ul>
                    <p className="text-sm text-red-300 mt-3">
                      If you believe this is an error, please contact support to appeal the decision.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user || submittingCashOut) return;

                // Validation
                if (!cashOutForm.paymentMethod.trim()) {
                  toast({
                    title: "Error",
                    description: "Payment method is required",
                    variant: "destructive",
                  });
                  return;
                }

                if (!cashOutForm.affiliateCode.trim()) {
                  toast({
                    title: "Error",
                    description: "Affiliate code is required",
                    variant: "destructive",
                  });
                  return;
                }

                const amountNum = parseFloat(cashOutForm.amount);
                if (!cashOutForm.amount.trim() || isNaN(amountNum) || amountNum <= 0) {
                  toast({
                    title: "Error",
                    description: "Please enter a valid amount",
                    variant: "destructive",
                  });
                  return;
                }

                setSubmittingCashOut(true);
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                  await safeFetch(`${apiUrl}/affiliate/cash-out-request`, {
                    method: "POST",
                    headers: {
                      "x-user-email": user.primaryEmailAddress?.emailAddress || "",
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      paymentMethod: cashOutForm.paymentMethod.trim(),
                      affiliateCode: cashOutForm.affiliateCode.trim().toUpperCase(),
                      amount: amountNum.toString(), // Send as string, backend will parse
                    }),
                  });

                  toast({
                    title: "Success",
                    description: "Cash-out request submitted successfully. Admin will review and process it.",
                  });

                  // Reset form
                  setCashOutForm({
                    paymentMethod: "",
                    affiliateCode: "",
                    amount: "",
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to submit cash-out request",
                    variant: "destructive",
                  });
                } finally {
                  setSubmittingCashOut(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-white">
                  Payment Method
                </Label>
                <Input
                  id="paymentMethod"
                  type="text"
                  placeholder="e.g., PayPal: email@example.com or Bank Account: IBAN..."
                  value={cashOutForm.paymentMethod}
                  onChange={(e) =>
                    setCashOutForm({ ...cashOutForm, paymentMethod: e.target.value })
                  }
                  className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white placeholder:text-[var(--voyage-muted)]"
                  disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliateCode" className="text-white">
                  Affiliate Code
                </Label>
                <Input
                  id="affiliateCode"
                  type="text"
                  placeholder={dashboard?.affiliate?.referralCode || ''}
                  value={cashOutForm.affiliateCode}
                  onChange={(e) =>
                    setCashOutForm({ ...cashOutForm, affiliateCode: e.target.value.toUpperCase() })
                  }
                  className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white placeholder:text-[var(--voyage-muted)] font-mono"
                  disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
                />
                <p className="text-xs text-[var(--voyage-muted)]">
                  Your affiliate code: <span className="font-mono font-bold">{dashboard?.affiliate?.referralCode || 'N/A'}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount (USD)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cashOutForm.amount}
                  onChange={(e) =>
                    setCashOutForm({ ...cashOutForm, amount: e.target.value })
                  }
                  className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white placeholder:text-[var(--voyage-muted)]"
                  disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
                />
                {dashboard?.remainingCommission && dashboard.remainingCommission > 0 && (
                  <p className="text-xs text-[var(--voyage-muted)]">
                    Available: {formatCurrency(dashboard?.remainingCommission || 0)} (or request cash-out)
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
                disabled={submittingCashOut || dashboard?.affiliate?.isFrozen}
              >
                {submittingCashOut ? "Submitting..." : "Submit Cash-Out Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>


      {/* Recent Purchases */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {!dashboard?.recentPurchases || (Array.isArray(dashboard.recentPurchases) && dashboard.recentPurchases.length === 0) ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No purchases yet from your referrals</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--voyage-border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Commission</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentPurchases || []).map((purchase) => (
                    <tr key={purchase.id} className="border-b border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]">
                      <td className="py-3 px-4 text-white">
                        <div>
                          <p className="font-medium">{purchase.userName || purchase.userEmail}</p>
                          <p className="text-xs text-[var(--voyage-muted)]">{purchase.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-[var(--voyage-border)] text-[var(--voyage-muted)]">
                          {purchase.type === "order" ? "Order" : "Top-up"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white">{formatCurrency(purchase.amountCents, purchase.displayCurrency, purchase.displayAmountCents)}</td>
                      <td className="py-3 px-4 text-[var(--voyage-accent)] font-medium">
                        {(() => {
                          // Calculate commission in the same currency as the purchase
                          if (purchase.displayCurrency && purchase.displayAmountCents) {
                            const commissionCents = Math.round(purchase.displayAmountCents * 0.1);
                            return formatCurrency(commissionCents, purchase.displayCurrency, commissionCents);
                          }
                          // Fallback: calculate from USD
                          return formatCurrency(Math.round(purchase.amountCents * 0.1));
                        })()}
                      </td>
                      <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">{formatDate(purchase.createdAt)}</td>
                      <td className="py-3 px-4">
                        {(() => {
                          const statusDisplay = purchase.type === "order"
                            ? getOrderStatusDisplay(purchase.status)
                            : getTopUpStatusDisplay(purchase.status);
                          return (
                            <Badge className={`border ${statusDisplay.className}`}>
                              {statusDisplay.label}
                            </Badge>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {!dashboard?.referrals || (Array.isArray(dashboard.referrals) && dashboard.referrals.length === 0) ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No referrals yet. Share your link to get started!</p>
          ) : (
            <div className="space-y-4">
              {(dashboard?.referrals || []).map((referral) => (
                <div
                  key={referral.id}
                  className="p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-white">{referral.user.name || referral.user.email}</p>
                      <p className="text-sm text-[var(--voyage-muted)]">{referral.user.email}</p>
                      <p className="text-xs text-[var(--voyage-muted)] mt-1">Joined: {formatDate(referral.user.joinedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--voyage-muted)]">Orders: {referral.orders.length}</p>
                      <p className="text-sm text-[var(--voyage-muted)]">Top-ups: {referral.topups.length}</p>
                    </div>
                  </div>
                  {(referral.orders.length > 0 || referral.topups.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-[var(--voyage-border)] space-y-2">
                      {referral.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--voyage-muted)]">Order: {formatCurrency(order.amountCents, order.displayCurrency, order.displayAmountCents)}</span>
                          <span className="text-[var(--voyage-accent)]">
                            {(() => {
                              // Calculate commission in the same currency as the order
                              if (order.displayCurrency && order.displayAmountCents) {
                                const commissionCents = Math.round(order.displayAmountCents * 0.1);
                                return `Commission: ${formatCurrency(commissionCents, order.displayCurrency, commissionCents)}`;
                              }
                              return `Commission: ${formatCurrency(Math.round(order.amountCents * 0.1))}`;
                            })()}
                          </span>
                        </div>
                      ))}
                      {referral.topups.map((topup) => (
                        <div key={topup.id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--voyage-muted)]">Top-up: {formatCurrency(topup.amountCents, topup.displayCurrency, topup.displayAmountCents)}</span>
                          <span className="text-[var(--voyage-accent)]">
                            {(() => {
                              // Calculate commission in the same currency as the topup
                              if (topup.displayCurrency && topup.displayAmountCents) {
                                const commissionCents = Math.round(topup.displayAmountCents * 0.1);
                                return `Commission: ${formatCurrency(commissionCents, topup.displayCurrency, commissionCents)}`;
                              }
                              return `Commission: ${formatCurrency(Math.round(topup.amountCents * 0.1))}`;
                            })()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer - Affiliate Terms Link */}
      <div className="pt-4 border-t border-[var(--voyage-border)] text-center">
        <p className="text-sm text-[var(--voyage-muted)]">
          By participating in the affiliate program, you agree to the{" "}
          <Link href="/support/affiliate-terms" className="text-[var(--voyage-accent)] hover:underline">
            Voyage Affiliate Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

