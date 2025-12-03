"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DollarSign, Users } from "lucide-react";

interface Affiliate {
  id: string;
  referralCode: string;
  totalCommission: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  _count: {
    referrals: number;
    commissions: number;
  };
}

export default function AdminAffiliatesPage() {
  const { user } = useUser();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/affiliates?page=${pagination.page}&limit=${pagination.limit}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAffiliates(data.affiliates || []);
          setPagination(data.pagination || pagination);
        }
      } catch (error) {
        console.error("Failed to fetch affiliates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAffiliates();
    }
  }, [user, pagination.page, apiUrl]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading affiliates...</p>
      </div>
    );
  }

  const columns = [
    {
      header: "User Email",
      accessor: (row: Affiliate) => row.user.email,
    },
    {
      header: "Name",
      accessor: (row: Affiliate) => row.user.name || "N/A",
    },
    {
      header: "Referral Code",
      accessor: (row: Affiliate) => (
        <span className="font-mono font-bold text-[var(--voyage-accent)]">{row.referralCode}</span>
      ),
    },
    {
      header: "Total Commission",
      accessor: (row: Affiliate) => (
        <span className="font-medium text-green-400">{formatCurrency(row.totalCommission)}</span>
      ),
    },
    {
      header: "Referrals",
      accessor: (row: Affiliate) => row._count.referrals,
    },
    {
      header: "Commissions",
      accessor: (row: Affiliate) => row._count.commissions,
    },
    {
      header: "Created",
      accessor: (row: Affiliate) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Affiliates</h1>
        <p className="text-[var(--voyage-muted)]">View all affiliates and their performance</p>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">All Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No affiliates found</p>
          ) : (
            <AdminTable data={affiliates} columns={columns} emptyMessage="No affiliates found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

