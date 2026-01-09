"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import Link from "next/link";
import { DollarSign, ArrowRight, Wallet, MessageSquare, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";

interface VCashBalance {
  balanceCents: number;
  currency: string;
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { formatCurrency: formatCurrencyContext, convert } = useCurrency();
  const [vcashBalance, setVcashBalance] = useState<VCashBalance | null>(null);
  const [loadingVCash, setLoadingVCash] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchVCash = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<VCashBalance>(`${apiUrl}/vcash`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        setVcashBalance(data);
      } catch (error) {
        console.error("Failed to fetch V-Cash balance:", error);
      } finally {
        setLoadingVCash(false);
      }
    };

    fetchVCash();
  }, [user, isLoaded]);

  const formatCurrency = (cents: number) => {
    const amountUSD = cents / 100;
    const convertedAmount = convert(amountUSD);
    return formatCurrencyContext(convertedAmount);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Breadcrumbs />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
          <p className="text-[var(--voyo-muted)]">Manage your account settings</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="border-[var(--voyo-border)] bg-[var(--voyo-card)] text-white hover:bg-[var(--voyo-bg-light)] hover:text-white hover:border-[var(--voyo-accent)]">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* V-Cash Balance Card */}
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-[var(--voyo-accent)]" />
            <CardTitle className="text-white">V-Cash Balance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingVCash ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-3xl font-bold text-[var(--voyo-accent)]">
              {vcashBalance ? formatCurrency(vcashBalance.balanceCents) : "$0.00"}
            </p>
          )}
          <p className="text-sm text-[var(--voyo-muted)]">
            V-Cash is store credit you can use on Voyo purchases. Get V-Cash from refunds or affiliate earnings.
          </p>
          <Link href="/account/vcash" className="inline-block">
            <Button variant="outline" className="border-[var(--voyo-border)] bg-[var(--voyo-card)] text-white hover:bg-[var(--voyo-bg-light)] hover:text-white hover:border-[var(--voyo-accent)] w-full sm:w-auto">
              View V-Cash Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Affiliate Program Card */}
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-[var(--voyo-accent)]" />
            <CardTitle className="text-white">Affiliate Program</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--voyo-muted)]">
            Earn 10% lifetime commissions on all purchases from your referrals (initial eSIM purchases and top-ups).
            Share your unique referral link and start earning today!
          </p>
          <Link href="/account/affiliate" className="inline-block">
            <Button className="bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white w-full sm:w-auto">
              View Affiliate Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Support Tickets Card */}
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-[var(--voyo-accent)]" />
            <CardTitle className="text-white">Support Tickets</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--voyo-muted)]">
            View all your support tickets and responses from our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/account/support" className="w-full sm:w-auto">
              <Button variant="outline" className="border-[var(--voyo-border)] bg-[var(--voyo-card)] text-white hover:bg-[var(--voyo-bg-light)] hover:text-white hover:border-[var(--voyo-accent)] w-full sm:w-auto">
                View My Tickets
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/support/contact" className="w-full sm:w-auto">
              <Button className="bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white w-full sm:w-auto">
                Create New Ticket
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recently Viewed */}
      <RecentlyViewed />
    </div>
  );
}

