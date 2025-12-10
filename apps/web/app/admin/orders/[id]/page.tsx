"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, RotateCcw, Mail, FileText } from "lucide-react";
import { formatUsdDollars } from "@/lib/utils";
import { getOrderStatusDisplay, getEsimStatusDisplay, getPlanName } from "@/lib/admin-helpers";

interface Order {
  id: string;
  planId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentRef?: string;
  esimOrderNo?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  profiles: Array<{
    id: string;
    iccid: string;
    esimTranNo: string;
    esimStatus?: string;
    smdpStatus?: string;
  }>;
  webhookEvents?: Array<{
    id: string;
    source: string;
    payload: any;
    processed: boolean;
    createdAt: string;
  }>;
}

export default function AdminOrderDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/orders/${params.id}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Ensure arrays are always present
          setOrder({
            ...data,
            profiles: data.profiles || [],
            webhookEvents: data.webhookEvents || [],
          });
          
          // Fetch plan name
          if (data.planId) {
            const name = await getPlanName(data.planId, apiUrl);
            setPlanName(name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && params.id) {
      fetchOrder();
    }
  }, [user, params.id, apiUrl]);

  const handleRetry = async () => {
    setActionLoading("retry");
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${params.id}/retry`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      const result = await res.json();
      
      if (res.ok && result.success !== false) {
        alert("Order retry initiated");
        // Reload order data
        const res2 = await fetch(`${apiUrl}/admin/orders/${params.id}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });
        if (res2.ok) {
          const data = await res2.json();
          // Ensure arrays are always present
          setOrder({
            ...data,
            profiles: data.profiles || [],
            webhookEvents: data.webhookEvents || [],
          });
          // Reload plan name too
          if (data.planId) {
            const name = await getPlanName(data.planId, apiUrl);
            setPlanName(name);
          }
        }
      } else {
        alert(result.error || "Failed to retry order");
      }
    } catch (error) {
      console.error("Failed to retry order:", error);
      alert("Failed to retry order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async () => {
    setActionLoading("sync");
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${params.id}/sync`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        alert("Order sync completed");
        // Reload order data
        const res2 = await fetch(`${apiUrl}/admin/orders/${params.id}`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });
        if (res2.ok) {
          const data = await res2.json();
          // Ensure arrays are always present
          setOrder({
            ...data,
            profiles: data.profiles || [],
            webhookEvents: data.webhookEvents || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to sync order:", error);
      alert("Failed to sync order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendReceipt = async () => {
    setActionLoading("resend");
    try {
      const res = await fetch(`${apiUrl}/orders/${params.id}/resend-receipt`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Receipt email sent successfully!");
      } else {
        const data = await res.json();
        alert(`Failed to resend receipt: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Failed to resend receipt:", error);
      alert(`Failed to resend receipt: ${error.message || "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !order) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyage-muted)]">Loading order...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/orders")}
          className="text-[var(--voyage-muted)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Details</h1>
          <p className="text-[var(--voyage-muted)]">Order ID: {order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">Status</p>
              {(() => {
                const statusDisplay = getOrderStatusDisplay(order.status);
                return <Badge className={`mt-1 ${statusDisplay.className}`}>{statusDisplay.label}</Badge>;
              })()}
            </div>
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">Plan</p>
              <div className="text-white">
                {planName && planName !== order.planId ? (
                  <>
                    <div>{planName}</div>
                    <div className="text-xs text-[var(--voyage-muted)] font-mono">{order.planId}</div>
                  </>
                ) : (
                  <span className="font-mono">{order.planId}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">Amount</p>
              <p className="text-white">{formatUsdDollars(order.amountCents / 100)}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">Payment Method</p>
              <p className="text-white">{order.paymentMethod}</p>
            </div>
            {order.paymentRef && (
              <div>
                <p className="text-sm text-[var(--voyage-muted)]">Payment Ref</p>
                <p className="text-white font-mono text-xs">{order.paymentRef}</p>
              </div>
            )}
            {order.esimOrderNo && (
              <div>
                <p className="text-sm text-[var(--voyage-muted)]">Provider Order No</p>
                <p className="text-white font-mono text-xs">{order.esimOrderNo}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">Created</p>
              <p className="text-white">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">Email</p>
              <p className="text-white">{order.user.email}</p>
            </div>
            {order.user.name && (
              <div>
                <p className="text-sm text-[var(--voyage-muted)]">Name</p>
                <p className="text-white">{order.user.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--voyage-muted)]">User ID</p>
              <p className="text-white font-mono text-xs">{order.user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.profiles && order.profiles.length > 0 && (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white">eSIM Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--voyage-muted)]">ICCID</p>
                      <p className="text-white font-mono text-xs">{profile.iccid}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/esims/${profile.id}`)}
                    >
                      View
                    </Button>
                  </div>
                  {profile.esimStatus && (
                    <div className="mt-2">
                      {(() => {
                        const statusDisplay = getEsimStatusDisplay(profile.esimStatus);
                        return <Badge className={statusDisplay.className}>{statusDisplay.label}</Badge>;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Actions</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                disabled={actionLoading !== null}
                className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]"
              >
                {actionLoading === "retry" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Retry
              </Button>
              <Button
                onClick={handleSync}
                disabled={actionLoading !== null}
                variant="outline"
                className="border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]"
              >
                {actionLoading === "sync" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync
              </Button>
              <Button
                onClick={handleResendReceipt}
                disabled={actionLoading !== null}
                variant="outline"
                className="border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]"
              >
                {actionLoading === "resend" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Resend Receipt
              </Button>
            </div>
          </div>
        </CardHeader>
        {order.webhookEvents && order.webhookEvents.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-[var(--voyage-muted)] mb-2">Webhook Events</p>
              {order.webhookEvents.map((event) => (
                <details
                  key={event.id}
                  className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]"
                >
                  <summary className="cursor-pointer text-sm text-white">
                    {event.source} - {new Date(event.createdAt).toLocaleString()}
                  </summary>
                  <pre className="mt-2 text-xs text-[var(--voyage-muted)] overflow-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Receipt Section */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Receipt</h3>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)]"
            onClick={async () => {
              const receiptUrl = `${apiUrl}/orders/${order.id}/receipt`;
              const adminEmail = user?.primaryEmailAddress?.emailAddress || '';
              
              try {
                const res = await fetch(receiptUrl, {
                  headers: {
                    'x-admin-email': adminEmail,
                  },
                });
                
                if (!res.ok) {
                  throw new Error('Failed to download receipt');
                }
                
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${order.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err) {
                console.error('Failed to download receipt:', err);
                alert('Failed to download receipt. Please try again.');
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

