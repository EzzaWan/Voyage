"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ArrowRight, Wallet, MessageSquare } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
        <p className="text-[var(--voyage-muted)]">Manage your account settings</p>
      </div>

      {/* V-Cash Balance Card */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-[var(--voyage-accent)]" />
            <CardTitle className="text-white">V-Cash Balance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingVCash ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-3xl font-bold text-[var(--voyage-accent)]">
              {vcashBalance ? formatCurrency(vcashBalance.balanceCents) : "$0.00"}
            </p>
          )}
          <p className="text-sm text-[var(--voyage-muted)]">
            V-Cash is store credit you can use on Voyage purchases. Get V-Cash from refunds or affiliate earnings.
          </p>
          <Link href="/account/vcash">
            <Button variant="outline" className="border-[var(--voyage-border)]">
              View V-Cash Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Affiliate Program Card */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-[var(--voyage-accent)]" />
            <CardTitle className="text-white">Affiliate Program</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--voyage-muted)]">
            Earn 10% lifetime commissions on all purchases from your referrals (initial eSIM purchases and top-ups).
            Share your unique referral link and start earning today!
          </p>
          <Link href="/account/affiliate">
            <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
              View Affiliate Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Support Tickets Card */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-[var(--voyage-accent)]" />
            <CardTitle className="text-white">Support Tickets</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--voyage-muted)]">
            View all your support tickets and responses from our support team.
          </p>
          <div className="flex gap-3">
            <Link href="/account/support">
              <Button variant="outline" className="border-[var(--voyage-border)]">
                View My Tickets
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/support/contact">
              <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
                Create New Ticket
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

