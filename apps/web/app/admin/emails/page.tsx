"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/badge";

interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  template: string;
  providerId: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export default function AdminEmailLogsPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      params.append("limit", "100");

      const res = await fetch(`${apiUrl}/admin/email/logs?${params.toString()}`, {
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch email logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      sent: { label: "Sent", className: "bg-green-500/20 text-green-400" },
      failed: { label: "Failed", className: "bg-red-500/20 text-red-400" },
      mock: { label: "Mock", className: "bg-yellow-500/20 text-yellow-400" },
      pending: { label: "Pending", className: "bg-blue-500/20 text-blue-400" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-500/20 text-gray-400" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const columns = useMemo(() => [
    {
      header: "To",
      accessor: (row: EmailLog) => row.to,
      render: (row: EmailLog) => (
        <div className="truncate max-w-[180px]" title={row.to}>
          {row.to}
        </div>
      ),
      className: "w-[150px]",
    },
    {
      header: "Subject",
      accessor: (row: EmailLog) => row.subject,
      render: (row: EmailLog) => (
        <div className="truncate max-w-[220px]" title={row.subject}>
          {row.subject}
        </div>
      ),
      className: "w-[150px]",
    },
    {
      header: "Template",
      accessor: (row: EmailLog) => row.template,
      className: "w-[100px] font-mono text-xs",
    },
    {
      header: "Status",
      accessor: (row: EmailLog) => row.status,
      render: (row: EmailLog) => getStatusBadge(row.status),
      className: "w-[80px]",
    },
    {
      header: "Provider ID",
      accessor: (row: EmailLog) => row.providerId || "",
      render: (row: EmailLog) =>
        row.providerId ? (
          <div className="font-mono text-xs truncate max-w-[120px]" title={row.providerId}>
            {row.providerId}
          </div>
        ) : (
          <span className="text-[var(--voyage-muted)]">—</span>
        ),
      className: "w-[120px]",
    },
    {
      header: "Error",
      accessor: (row: EmailLog) => row.error || "",
      render: (row: EmailLog) =>
        row.error ? (
          <div className="text-red-400 text-xs truncate max-w-[150px]" title={row.error}>
            {row.error}
          </div>
        ) : (
          <span className="text-[var(--voyage-muted)]">—</span>
        ),
      className: "w-[150px]",
    },
    {
      header: "Sent At",
      accessor: (row: EmailLog) =>
        new Date(row.createdAt).toLocaleString(),
      className: "w-[150px]",
    },
  ], []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading email logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Logs</h1>
          <p className="text-[var(--voyage-muted)]">
            View all email notification logs
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] text-white"
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="mock">Mock</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--voyage-muted)]">No email logs found</p>
            </div>
          ) : (
            <AdminTable data={logs} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

