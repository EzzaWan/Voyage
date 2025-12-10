"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Smartphone, ShoppingCart, Calendar, MessageCircle } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import Link from "next/link";

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  orderId: string | null;
  device: string | null;
  message: string;
  createdAt: string;
  replyCount?: number;
}

export default function AdminSupportTicketsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await safeFetch<{ tickets: SupportTicket[]; total: number }>(
        `${apiUrl}/admin/support/tickets?limit=100`,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: "Name",
      accessor: (row: SupportTicket) => row.name,
      className: "w-[150px] font-medium text-white",
    },
    {
      header: "Email",
      accessor: (row: SupportTicket) => row.email,
      render: (row: SupportTicket) => (
        <div className="truncate max-w-[200px]" title={row.email}>
          <a href={`mailto:${row.email}`} className="text-[var(--voyage-accent)] hover:underline">
            {row.email}
          </a>
        </div>
      ),
      className: "w-[200px]",
    },
    {
      header: "Order ID",
      accessor: (row: SupportTicket) => row.orderId || "",
      render: (row: SupportTicket) =>
        row.orderId ? (
          <Link href={`/admin/orders/${row.orderId}`} className="text-[var(--voyage-accent)] hover:underline font-mono text-sm">
            {row.orderId}
          </Link>
        ) : (
          <span className="text-[var(--voyage-muted)]">—</span>
        ),
      className: "w-[150px]",
    },
    {
      header: "Device",
      accessor: (row: SupportTicket) => row.device || "",
      render: (row: SupportTicket) =>
        row.device ? (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[var(--voyage-muted)]" />
            <span className="text-sm">{row.device}</span>
          </div>
        ) : (
          <span className="text-[var(--voyage-muted)]">—</span>
        ),
      className: "w-[150px]",
    },
    {
      header: "Message",
      accessor: (row: SupportTicket) => row.message,
      render: (row: SupportTicket) => (
        <div className="truncate max-w-[300px]" title={row.message}>
          <p className="text-sm text-[var(--voyage-muted)]">{row.message}</p>
        </div>
      ),
      className: "w-[300px]",
    },
    {
      header: "Replies",
      accessor: (row: SupportTicket) => row.replyCount || 0,
      render: (row: SupportTicket) => (
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[var(--voyage-muted)]" />
          <span className="text-sm">{row.replyCount || 0}</span>
        </div>
      ),
      className: "w-[100px]",
    },
    {
      header: "Submitted",
      accessor: (row: SupportTicket) => new Date(row.createdAt).toLocaleString(),
      className: "w-[180px]",
    },
  ], []);

  const handleRowClick = (row: SupportTicket) => {
    router.push(`/admin/support/${row.id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Support Tickets
          </h1>
          <p className="text-[var(--voyage-muted)]">
            View all contact form submissions from users ({total} total)
          </p>
        </div>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-[var(--voyage-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--voyage-muted)]">No support tickets found</p>
            </div>
          ) : (
            <AdminTable data={tickets} columns={columns} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

