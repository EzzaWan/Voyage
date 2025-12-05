"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Users, DollarSign, ShoppingCart, ExternalLink, ArrowLeft } from "lucide-react";
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
    createdAt: string;
  };
  stats: {
    totalCommission: number;
    totalReferrals: number;
    totalPurchases: number;
    totalCommissions: number;
  };
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
  const { selectedCurrency, convert, formatCurrency: formatCurrencyContext } = useCurrency();
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchDashboard = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any>(`${apiUrl}/affiliate/dashboard`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        setDashboard(data);
      } catch (error) {
        console.error("Failed to fetch affiliate dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, isLoaded]);

  const copyReferralLink = async () => {
    if (!dashboard) return;

    try {
      await navigator.clipboard.writeText(dashboard.affiliate.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Format currency: use actual payment currency if available, otherwise convert from USD
  const formatCurrency = (
    centsUSD: number,
    displayCurrency?: string | null,
    displayAmountCents?: number | null
  ) => {
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
    const amountUSD = centsUSD / 100;
    const convertedAmount = convert(amountUSD);
    return formatCurrencyContext(convertedAmount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isLoaded || loading) {
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

  if (!dashboard) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Failed to load dashboard</h1>
        <p className="text-[var(--voyage-muted)]">Please try refreshing the page.</p>
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

      {/* Referral Link Card */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
              <p className="text-sm text-[var(--voyage-muted)] mb-1">Referral Code</p>
              <p className="text-2xl font-bold text-white font-mono">{dashboard.affiliate.referralCode}</p>
            </div>
            <div className="flex-1 p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
              <p className="text-sm text-[var(--voyage-muted)] mb-1">Referral Link</p>
              <p className="text-sm text-white break-all">{dashboard.affiliate.referralLink}</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--voyage-muted)] mb-1">Total Commission</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(dashboard.stats.totalCommission)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[var(--voyage-accent)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--voyage-muted)] mb-1">Total Referrals</p>
                <p className="text-2xl font-bold text-white">{dashboard.stats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-[var(--voyage-accent)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--voyage-muted)] mb-1">Total Purchases</p>
                <p className="text-2xl font-bold text-white">{dashboard.stats.totalPurchases}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-[var(--voyage-accent)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--voyage-muted)] mb-1">Commission Records</p>
                <p className="text-2xl font-bold text-white">{dashboard.stats.totalCommissions}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[var(--voyage-accent)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentPurchases.length === 0 ? (
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
                  {dashboard.recentPurchases.map((purchase) => (
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
          {dashboard.referrals.length === 0 ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No referrals yet. Share your link to get started!</p>
          ) : (
            <div className="space-y-4">
              {dashboard.referrals.map((referral) => (
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
    </div>
  );
}

