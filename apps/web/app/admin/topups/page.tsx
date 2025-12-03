"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsdDollars } from "@/lib/utils";
import { getTopUpStatusDisplay, getPlanNames } from "@/lib/admin-helpers";

interface TopUp {
  id: string;
  planCode: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentRef?: string;
  rechargeOrder?: string;
  createdAt: string;
  user: {
    email: string;
  };
  profile: {
    iccid: string;
    esimTranNo: string;
  };
}

export default function AdminTopupsPage() {
  const { user } = useUser();
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [planNames, setPlanNames] = useState<Map<string, string>>(new Map());
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchTopups = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/topups`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setTopups(data);
          
          // Fetch plan names for all unique plan codes
          const uniquePlanCodes = Array.from(new Set(data.map((t: TopUp) => t.planCode))) as string[];
          const names = await getPlanNames(uniquePlanCodes, apiUrl);
          setPlanNames(names);
        }
      } catch (error) {
        console.error("Failed to fetch topups:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTopups();
    }
  }, [user, apiUrl]);

  const columns = [
    {
      header: "ID",
      accessor: (row: TopUp) => (
        <span className="font-mono text-xs">{row.id}</span>
      ),
      className: "break-all min-w-[120px]",
    },
    {
      header: "esimTranNo",
      accessor: (row: TopUp) => (
        <span className="font-mono text-xs">{row.profile.esimTranNo}</span>
      ),
      className: "break-all min-w-[100px]",
    },
    {
      header: "Plan",
      accessor: (row: TopUp) => {
        const planName = planNames.get(row.planCode);
        return (
          <div>
            <div className="text-white">{planName || row.planCode}</div>
            {planName && (
              <div className="text-xs text-[var(--voyage-muted)] font-mono">{row.planCode}</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Amount",
      accessor: (row: TopUp) =>
        formatUsdDollars(row.amountCents / 100),
    },
    {
      header: "Status",
      accessor: (row: TopUp) => {
        const statusDisplay = getTopUpStatusDisplay(row.status);
        return <Badge className={statusDisplay.className}>{statusDisplay.label}</Badge>;
      },
    },
    {
      header: "Provider Response",
      accessor: (row: TopUp) =>
        row.rechargeOrder ? (
          <span className="font-mono text-xs">{row.rechargeOrder}</span>
        ) : (
          <span className="text-[var(--voyage-muted)]">-</span>
        ),
      className: "break-all min-w-[100px]",
    },
    {
      header: "User Email",
      accessor: (row: TopUp) => row.user.email,
    },
    {
      header: "Created",
      accessor: (row: TopUp) =>
        new Date(row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading top-ups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Top-ups</h1>
        <p className="text-[var(--voyage-muted)]">
          Monitor all top-up transactions
        </p>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardContent className="p-0">
          <AdminTable
            data={topups}
            columns={columns}
            emptyMessage="No top-ups found"
          />
        </CardContent>
      </Card>
    </div>
  );
}

