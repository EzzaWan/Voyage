"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { useCurrency } from "@/components/providers/CurrencyProvider";

export default function PayoutHistoryPage() {
  const { user, isLoaded } = useUser();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchHistory = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<{ history: any[] }>(`${apiUrl}/affiliate/payout/history`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        setHistory(data.history || []);
      } catch (error) {
        console.error("Failed to fetch payout history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, isLoaded]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      declined: "bg-red-500",
      paid: "bg-green-500",
    };
    return (
      <Badge className={colors[status] || "bg-gray-500"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!isLoaded || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/account/affiliate"
        className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliate Dashboard
      </Link>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No payout requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--voyage-border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Requested</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Processed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payout) => (
                    <tr key={payout.id} className="border-b border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]">
                      <td className="py-3 px-4 text-white font-medium">
                        {formatCurrency(payout.amountCents / 100)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">
                        {formatDate(payout.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">
                        {payout.processedAt ? formatDate(payout.processedAt) : "-"}
                      </td>
                      <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">
                        {payout.adminNote || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


