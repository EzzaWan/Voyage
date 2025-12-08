"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useCurrency } from "@/components/providers/CurrencyProvider";

export default function PayoutRequestPage() {
  const { user, isLoaded } = useUser();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payoutMethod, setPayoutMethod] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const MIN_PAYOUT = 2000; // $20 minimum

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        
        // Fetch dashboard to get balance and payout method
        const dashboard = await safeFetch<any>(`${apiUrl}/affiliate/dashboard`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });

        setAvailableBalance(dashboard.balances?.availableBalance || 0);
        setPayoutMethod(dashboard.payoutMethod);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load payout information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountCents = Math.round(parseFloat(amount) * 100);
    
    if (amountCents < MIN_PAYOUT) {
      toast({
        title: "Error",
        description: `Minimum payout is ${formatCurrency(MIN_PAYOUT / 100)}`,
        variant: "destructive",
      });
      return;
    }

    if (amountCents > availableBalance) {
      toast({
        title: "Error",
        description: "Requested amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/affiliate/payout/request`, {
        method: "POST",
        headers: {
          "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountCents }),
      });

      toast({
        title: "Success",
        description: "Payout request submitted successfully",
      });
      setTimeout(() => {
        window.location.href = "/account/affiliate";
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payout request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!payoutMethod) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/account/affiliate"
          className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliate Dashboard
        </Link>
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="pt-6">
            <p className="text-white mb-4">You need to configure a payout method first.</p>
            <Link href="/account/affiliate/payout/methods">
              <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]">
                Add Payout Method
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (availableBalance < MIN_PAYOUT) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/account/affiliate"
          className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliate Dashboard
        </Link>
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="pt-6">
            <p className="text-white mb-2">Available Balance: {formatCurrency(availableBalance / 100)}</p>
            <p className="text-[var(--voyage-muted)]">
              Minimum payout is {formatCurrency(MIN_PAYOUT / 100)}. You need {formatCurrency((MIN_PAYOUT - availableBalance) / 100)} more.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/account/affiliate"
        className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliate Dashboard
      </Link>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-[var(--voyage-bg-light)] rounded-lg">
            <p className="text-sm text-[var(--voyage-muted)] mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-[var(--voyage-accent)]">
              {formatCurrency(availableBalance / 100)}
            </p>
            <p className="text-sm text-[var(--voyage-muted)] mt-2">
              Payout Method: {payoutMethod.type === "paypal" ? `PayPal (${payoutMethod.paypalEmail})` : `Bank (${payoutMethod.bankHolderName})`}
            </p>
            <p className="text-xs text-[var(--voyage-muted)] mt-2">
              Minimum payout: {formatCurrency(MIN_PAYOUT / 100)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="amount" className="text-white">
                Payout Amount ($) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={MIN_PAYOUT / 100}
                max={availableBalance / 100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-2 bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white"
                placeholder="20.00"
              />
              <p className="text-xs text-[var(--voyage-muted)] mt-1">
                Enter amount between {formatCurrency(MIN_PAYOUT / 100)} and {formatCurrency(availableBalance / 100)}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Link href="/account/affiliate">
                <Button type="button" variant="outline" className="border-[var(--voyage-border)]">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

