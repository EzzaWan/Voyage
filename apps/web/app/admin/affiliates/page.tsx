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
    { key: "user.email", label: "User Email" },
    { key: "user.name", label: "Name" },
    { key: "referralCode", label: "Referral Code" },
    { key: "totalCommission", label: "Total Commission" },
    { key: "_count.referrals", label: "Referrals" },
    { key: "_count.commissions", label: "Commissions" },
    { key: "createdAt", label: "Created" },
  ];

  const rows = affiliates.map((affiliate) => ({
    id: affiliate.id,
    "user.email": affiliate.user.email,
    "user.name": affiliate.user.name || "N/A",
    referralCode: (
      <span className="font-mono font-bold text-[var(--voyage-accent)]">{affiliate.referralCode}</span>
    ),
    totalCommission: <span className="font-medium text-green-400">{formatCurrency(affiliate.totalCommission)}</span>,
    "_count.referrals": affiliate._count.referrals,
    "_count.commissions": affiliate._count.commissions,
    createdAt: formatDate(affiliate.createdAt),
  }));

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
            <AdminTable columns={columns} rows={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

