"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";

export default function AdminPayoutsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user, page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const data = await safeFetch<any>(`${apiUrl}/admin/affiliate/payouts?${params}`, {
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
        showToast: false,
      });

      setRequests(data.requests || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Failed to fetch payout requests:", error);
      toast({
        title: "Error",
        description: "Failed to load payout requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("Approve this payout request?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/affiliate/payouts/${requestId}/approve`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Payout request approved",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payout",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string, note?: string) => {
    const adminNote = prompt("Enter decline reason (optional):");
    if (adminNote === null) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/affiliate/payouts/${requestId}/decline`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNote: adminNote || undefined }),
      });

      toast({
        title: "Success",
        description: "Payout request declined",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline payout",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async (requestId: string) => {
    if (!confirm("Mark this payout as paid? This action cannot be undone.")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/admin/affiliate/payouts/${requestId}/mark-paid`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Payout marked as paid",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payout as paid",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Affiliate Payout Requests</h1>
        <p className="text-[var(--voyage-muted)]">Manage affiliate payout requests</p>
      </div>

      <div className="mb-4 flex gap-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg text-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-[var(--voyage-muted)] py-8">No payout requests found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--voyage-border)]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Affiliate</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Payout Method</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Requested</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--voyage-muted)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request: any) => (
                      <tr key={request.id} className="border-b border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">
                              {request.affiliate?.user?.name || request.affiliate?.user?.email}
                            </p>
                            <p className="text-xs text-[var(--voyage-muted)]">
                              {request.affiliate?.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {formatCurrency(request.amountCents)}
                        </td>
                        <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">
                          {request.affiliate?.payoutMethods?.[0] ? (
                            request.affiliate.payoutMethods[0].type === "paypal" ? (
                              `PayPal: ${request.affiliate.payoutMethods[0].paypalEmail}`
                            ) : (
                              `Bank: ${request.affiliate.payoutMethods[0].bankHolderName}`
                            )
                          ) : (
                            "Not configured"
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-3 px-4 text-[var(--voyage-muted)] text-sm">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecline(request.id)}
                                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {request.status === "approved" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                          {request.adminNote && (
                            <p className="text-xs text-[var(--voyage-muted)] mt-2">
                              Note: {request.adminNote}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-[var(--voyage-muted)]">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

