"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { safeFetch } from "@/lib/safe-fetch";

interface VCashBalance {
  balanceCents: number;
  currency: string;
}

interface VCashTransaction {
  id: string;
  type: "credit" | "debit";
  amountCents: number;
  reason: string;
  metadata?: any;
  createdAt: string;
}

export default function VCashPage() {
  const { user, isLoaded } = useUser();
  const { formatCurrency: formatCurrencyContext, convert } = useCurrency();
  const [balance, setBalance] = useState<VCashBalance | null>(null);
  const [transactions, setTransactions] = useState<VCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        
        const [balanceData, transactionsData] = await Promise.all([
          safeFetch<VCashBalance>(`${apiUrl}/vcash`, {
            headers: {
              "x-user-email": user.primaryEmailAddress?.emailAddress || "",
            },
            showToast: false,
          }),
          safeFetch<{ transactions: VCashTransaction[]; total: number; totalPages: number }>(
            `${apiUrl}/vcash/transactions?page=${page}&pageSize=50`,
            {
              headers: {
                "x-user-email": user.primaryEmailAddress?.emailAddress || "",
              },
              showToast: false,
            }
          ),
        ]);

        setBalance(balanceData);
        setTransactions(transactionsData.transactions);
        setTotalPages(transactionsData.totalPages);
      } catch (error) {
        console.error("Failed to fetch V-Cash data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isLoaded, page]);

  const formatCurrency = (cents: number) => {
    const amountUSD = cents / 100;
    const convertedAmount = convert(amountUSD);
    return formatCurrencyContext(convertedAmount);
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      refund: "Refund",
      affiliate_conversion: "Affiliate Conversion",
      manual_adjustment: "Manual Adjustment",
      purchase: "Purchase",
    };
    return labels[reason] || reason;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        <p className="text-[var(--voyage-muted)]">You must be signed in to access your V-Cash.</p>
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">V-Cash</h1>
        <p className="text-[var(--voyage-muted)]">
          V-Cash is store credit you can use on Voyage in the future. You can get V-Cash from refunds or affiliate earnings.
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Your V-Cash Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--voyage-muted)] mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-[var(--voyage-accent)]">
                {balance ? formatCurrency(balance.balanceCents) : "$0.00"}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-[var(--voyage-accent)]" />
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--voyage-border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]">
                      <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            transaction.type === "credit"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {transaction.type === "credit" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {transaction.type === "credit" ? "Credit" : "Debit"}
                        </Badge>
                      </td>
                      <td className={`py-3 px-4 font-medium ${
                        transaction.type === "credit" 
                          ? "text-green-400" 
                          : "text-red-400"
                      }`}>
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amountCents))}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {getReasonLabel(transaction.reason)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--voyage-border)]">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[var(--voyage-border)]"
              >
                Previous
              </Button>
              <span className="text-sm text-[var(--voyage-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[var(--voyage-border)]"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


