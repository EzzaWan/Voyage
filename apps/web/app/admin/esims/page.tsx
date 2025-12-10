"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEsimStatusDisplay } from "@/lib/admin-helpers";

interface EsimProfile {
  id: string;
  iccid: string;
  esimTranNo: string;
  esimStatus?: string;
  smdpStatus?: string;
  totalVolume?: string | null;
  expiredTime?: string | null;
  Order?: {
    User?: {
      email: string;
    };
    user?: {
      email: string;
    };
  };
  order?: {
    user: {
      email: string;
    };
  };
}

export default function AdminEsimsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchEsims = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/esims`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setEsims(data);
        }
      } catch (error) {
        console.error("Failed to fetch esims:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEsims();
    }
  }, [user, apiUrl]);

  const formatBytes = (bytes: string | null | undefined): string => {
    if (!bytes) return "N/A";
    try {
      const num = BigInt(bytes);
      const kb = BigInt(1024);
      const mb = kb * BigInt(1024);
      const gb = mb * BigInt(1024);
      
      if (num >= gb) return `${Number(num / gb)} GB`;
      if (num >= mb) return `${Number(num / mb)} MB`;
      if (num >= kb) return `${Number(num / kb)} KB`;
      return `${num} B`;
    } catch {
      return "N/A";
    }
  };

  const columns = useMemo(() => [
    {
      header: "ICCID",
      accessor: (row: EsimProfile) => row.iccid,
      className: "break-all min-w-[120px] font-mono text-xs",
    },
    {
      header: "esimTranNo",
      accessor: (row: EsimProfile) => row.esimTranNo,
      className: "break-all min-w-[100px] font-mono text-xs",
    },
    {
      header: "Status",
      accessor: (row: EsimProfile) => {
        const status = row.esimStatus || row.smdpStatus;
        const statusDisplay = getEsimStatusDisplay(status);
        return statusDisplay.label;
      },
      render: (row: EsimProfile) => {
        const status = row.esimStatus || row.smdpStatus;
        const statusDisplay = getEsimStatusDisplay(status);
        return <Badge className={statusDisplay.className}>{statusDisplay.label}</Badge>;
      },
    },
    {
      header: "Total Volume",
      accessor: (row: EsimProfile) => formatBytes(row.totalVolume),
    },
    {
      header: "Expired Time",
      accessor: (row: EsimProfile) =>
        row.expiredTime
          ? new Date(row.expiredTime).toLocaleDateString()
          : "N/A",
    },
    {
      header: "User Email",
      accessor: (row: EsimProfile) => {
        const order = row.Order || row.order;
        if (!order) return "-";
        const user = (order as any).User || (order as any).user;
        return user?.email || "-";
      },
    },
  ], []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading eSIM profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">eSIM Profiles</h1>
        <p className="text-[var(--voyage-muted)]">
          Manage and monitor all eSIM profiles
        </p>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardContent className="p-0">
          <AdminTable
            data={esims}
            columns={columns}
            onRowClick={(row) => router.push(`/admin/esims/${row.id}`)}
            emptyMessage="No eSIM profiles found"
          />
        </CardContent>
      </Card>
    </div>
  );
}

