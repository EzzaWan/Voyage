"use client";

import { useEffect, useState, useMemo } from "react";
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
  User?: {
    email: string;
  };
  user?: {
    email: string;
  };
  EsimProfile?: {
    iccid: string;
    esimTranNo: string;
  };
  profile?: {
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
          // Ensure data is an array and has proper structure
          const topupsData = Array.isArray(data) ? data : [];
          setTopups(topupsData);
          
          // Fetch plan names for all unique plan codes
          if (topupsData.length > 0) {
            const uniquePlanCodes = Array.from(new Set(topupsData.map((t: TopUp) => t.planCode).filter(Boolean))) as string[];
            if (uniquePlanCodes.length > 0) {
              const names = await getPlanNames(uniquePlanCodes, apiUrl);
              setPlanNames(names);
            }
          }
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

  const columns = useMemo(() => [
    {
      header: "ID",
      accessor: (row: TopUp) => row.id,
      className: "break-all min-w-[120px] font-mono text-xs",
    },
    {
      header: "esimTranNo",
      accessor: (row: TopUp) => {
        const profile = row.EsimProfile || row.profile;
        return profile?.esimTranNo || "-";
      },
      className: "break-all min-w-[100px] font-mono text-xs",
    },
    {
      header: "Plan",
      accessor: (row: TopUp) => {
        const planName = planNames.get(row.planCode);
        return planName || row.planCode;
      },
      render: (row: TopUp) => {
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
        return statusDisplay.label;
      },
      render: (row: TopUp) => {
        const statusDisplay = getTopUpStatusDisplay(row.status);
        return <Badge className={statusDisplay.className}>{statusDisplay.label}</Badge>;
      },
    },
    {
      header: "Provider Response",
      accessor: (row: TopUp) => row.rechargeOrder || "-",
      className: (row: TopUp) => row.rechargeOrder ? "break-all min-w-[100px] font-mono text-xs" : "break-all min-w-[100px] text-[var(--voyage-muted)]",
    },
    {
      header: "User Email",
      accessor: (row: TopUp) => {
        const user = row.User || row.user;
        return user?.email || "-";
      },
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
  ], [planNames]);

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

