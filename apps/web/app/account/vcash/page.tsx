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

  const getReasonLabel = (reason: string, metadata?: any) => {
    // Handle ORDER_PAYMENT with UUID
    if (reason.startsWith('ORDER_PAYMENT_')) {
      const orderId = reason.replace('ORDER_PAYMENT_', '');
      const planName = metadata?.planName || metadata?.plan?.name;
      if (planName) {
        return `Payment for ${planName}`;
      }
      return `Order Payment (${orderId.substring(0, 8)}...)`;
    }

    // Handle admin manual credit
    if (reason === 'admin_manual_credit' || reason === 'manual_adjustment') {
      const adminReason = metadata?.reason;
      if (adminReason && adminReason !== 'admin_manual_credit') {
        return `Admin Credit: ${adminReason}`;
      }
      return 'Admin Manual Credit';
    }

    // Handle affiliate conversion
    if (reason === 'AFFILIATE_COMMISSION_TO_VCASH' || reason === 'affiliate_conversion') {
      return 'Affiliate Commission Conversion';
    }

    // Handle refunds
    if (reason.startsWith('ORDER_REFUND') || reason === 'refund' || reason === 'ORDER_REFUND_VCASH') {
      const orderId = metadata?.orderId;
      const planName = metadata?.planName;
      if (planName) {
        return `Refund: ${planName}`;
      }
      if (orderId) {
        return `Refund for Order (${orderId.substring(0, 8)}...)`;
      }
      return 'Order Refund';
    }

    // Handle order refund to V-Cash
    if (reason === 'ORDER_REFUND_VCASH') {
      const orderId = metadata?.orderId;
      if (orderId) {
        return `Refund to V-Cash (Order ${orderId.substring(0, 8)}...)`;
      }
      return 'Refund to V-Cash';
    }

    // Generic mappings
    const labels: Record<string, string> = {
      refund: 'Refund',
      purchase: 'Purchase',
    };

    // Return formatted reason or original if no match
    return labels[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
                        <div className="flex flex-col">
                          <span>{getReasonLabel(transaction.reason, transaction.metadata)}</span>
                          {transaction.metadata?.orderId && !transaction.metadata?.planName && (
                            <span className="text-xs text-[var(--voyage-muted)] font-mono mt-1">
                              Order: {transaction.metadata.orderId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
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


