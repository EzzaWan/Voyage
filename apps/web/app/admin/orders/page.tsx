"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AdminTable } from "@/components/admin/AdminTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { formatUsdDollars } from "@/lib/utils";
import { getOrderStatusDisplay, getPlanNames } from "@/lib/admin-helpers";
import { useToast } from "@/components/ui/use-toast";

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
  User?: {
    email: string;
    name?: string;
  };
  user?: {
    email: string;
    name?: string;
  };
}

export default function AdminOrdersPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [planNames, setPlanNames] = useState<Map<string, string>>(new Map());
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/orders`, {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(data);
          
          // Fetch plan names for all unique plan IDs
          const uniquePlanIds = Array.from(new Set(data.map((o: Order) => o.planId))) as string[];
          const names = await getPlanNames(uniquePlanIds, apiUrl);
          setPlanNames(names);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, apiUrl]);

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete order ${orderId}?\n\nThis will permanently delete the order and all related data. This action cannot be undone.`)) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Order deleted successfully",
        });
        // Refresh orders list
        const updatedOrders = orders.filter((o) => o.id !== orderId);
        setOrders(updatedOrders);
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete order");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const columns = useMemo(() => [
    {
      header: "Order ID",
      accessor: (row: Order) => row.id,
      className: "break-all min-w-[120px] font-mono text-xs text-white",
    },
    {
      header: "User Email",
      accessor: (row: Order) => {
        const user = row.User || row.user;
        return user?.email || "-";
      },
      className: "text-white",
    },
    {
      header: "Plan",
      accessor: (row: Order) => {
        const planName = planNames.get(row.planId);
        return planName || row.planId;
      },
      render: (row: Order) => {
        const planName = planNames.get(row.planId);
        return (
          <div>
            <div className="text-white">{planName || row.planId}</div>
            {planName && (
              <div className="text-xs text-[var(--voyo-muted)] font-mono">{row.planId}</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Amount",
      accessor: (row: Order) =>
        formatUsdDollars(row.amountCents / 100),
      className: "text-white",
    },
    {
      header: "Status",
      accessor: (row: Order) => {
        const statusDisplay = getOrderStatusDisplay(row.status);
        return statusDisplay.label;
      },
      render: (row: Order) => {
        const statusDisplay = getOrderStatusDisplay(row.status);
        return <Badge className={statusDisplay.className}>{statusDisplay.label}</Badge>;
      },
    },
    {
      header: "Provider Order",
      accessor: (row: Order) => row.esimOrderNo || "-",
      className: (row: Order) => row.esimOrderNo ? "break-all min-w-[100px] font-mono text-xs text-white" : "break-all min-w-[100px] text-[var(--voyo-muted)]",
    },
    {
      header: "Payment Ref",
      accessor: (row: Order) => row.paymentRef || "-",
      className: (row: Order) => row.paymentRef ? "break-all min-w-[100px] font-mono text-xs text-white" : "break-all min-w-[100px] text-[var(--voyo-muted)]",
    },
    {
      header: "Created",
      accessor: (row: Order) =>
        new Date(row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      className: "text-white",
    },
    {
      header: "Actions",
      accessor: () => "",
      render: (row: Order) => {
        // Only allow deletion of pending orders
        const canDelete = row.status === "pending";
        return (
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteOrder(row.id, e)}
                disabled={deletingOrderId === row.id}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
      className: "text-white w-[80px]",
    },
  ], [planNames, deletingOrderId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyo-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--voyo-muted)]">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
          <p className="text-[var(--voyo-muted)]">
            Manage and monitor all orders
          </p>
        </div>
      </div>

      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardContent className="p-0">
          <AdminTable
            data={orders}
            columns={columns}
            onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
            emptyMessage="No orders found"
          />
        </CardContent>
      </Card>
    </div>
  );
}

