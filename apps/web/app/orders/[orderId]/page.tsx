"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Mail, ExternalLink, Download, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusDisplay } from "@/lib/admin-helpers";

interface OrderDetails {
  id: string;
  planId: string;
  amountCents: number;
  displayAmountCents?: number;
  displayCurrency?: string;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  receiptSent?: boolean;
  EsimProfile?: Array<{
    id: string;
    iccid: string;
    qrCodeUrl?: string | null;
    ac?: string | null;
    esimStatus?: string | null;
  }>;
}

function GuestOrderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !token || !email) {
      setError('Missing required parameters. Please use the link from your email.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const orderData = await safeFetch<OrderDetails>(
          `${apiUrl}/orders/${orderId}/guest?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
          { showToast: false }
        );
        setOrder(orderData);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError(err.message || 'Failed to load order. The link may have expired or is invalid.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, email]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--voyo-accent)]" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Order</h2>
                <p className="text-[var(--voyo-muted)] mb-4">{error || 'Order not found'}</p>
                <Link href="/">
                  <Button variant="outline" className="border-[var(--voyo-border)] bg-[var(--voyo-bg-light)] text-white hover:bg-[var(--voyo-card)] hover:text-white hover:border-[var(--voyo-accent)]">
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const esimProfile = order.EsimProfile?.[0];
  const displayAmount = order.displayAmountCents || order.amountCents;
  const displayCurrency = order.displayCurrency || order.currency;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Your eSIM Order</h1>
        <p className="text-[var(--voyo-muted)] text-lg">
          Order details and installation instructions
        </p>
      </div>

      {/* Order Details */}
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardHeader>
          <CardTitle className="text-white">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--voyo-muted)] mb-1">Order Number</p>
              <p className="text-lg font-mono font-semibold text-white">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--voyo-muted)] mb-1">Amount Paid</p>
              <p className="text-lg font-semibold text-[var(--voyo-accent)]">
                {formatCurrency(displayAmount / 100, displayCurrency)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--voyo-muted)] mb-1">Order Status</p>
            <div className="flex items-center gap-2">
              {(() => {
                const statusDisplay = getOrderStatusDisplay(order.status);
                const colorMatch = statusDisplay.className.match(/bg-(\w+)-500/);
                const dotColor = colorMatch ? `bg-${colorMatch[1]}-500` : 'bg-blue-500';
                return (
                  <>
                    <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <p className="text-sm font-medium text-white">{statusDisplay.label}</p>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code & Installation */}
      {esimProfile && esimProfile.qrCodeUrl && (
        <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Your eSIM QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 flex items-center justify-center">
              <img 
                src={esimProfile.qrCodeUrl} 
                alt="eSIM QR Code" 
                className="max-w-full h-auto"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[var(--voyo-border)] bg-[var(--voyo-bg-light)] text-white hover:bg-[var(--voyo-card)] hover:text-white hover:border-[var(--voyo-accent)]"
                onClick={() => esimProfile.qrCodeUrl && window.open(esimProfile.qrCodeUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open QR Code
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-[var(--voyo-border)] bg-[var(--voyo-bg-light)] text-white hover:bg-[var(--voyo-card)] hover:text-white hover:border-[var(--voyo-accent)]"
                onClick={() => {
                  if (esimProfile.qrCodeUrl) {
                    const link = document.createElement('a');
                    link.href = esimProfile.qrCodeUrl;
                    link.download = `esim-qr-${order.id}.png`;
                    link.click();
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Prompt */}
      <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-[var(--voyo-accent)] mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Save Your eSIM Info</h3>
              <p className="text-sm text-[var(--voyo-muted)] mb-4">
                Create an account or sign in to save your eSIM information and access it anytime. Use the same email address ({email}) that you used for checkout.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/sign-up?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/orders/' + orderId)}`}>
                  <Button className="w-full sm:w-auto bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/orders/' + orderId)}`}>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto border-[var(--voyo-border)] bg-[var(--voyo-bg-light)] text-white hover:bg-[var(--voyo-card)] hover:text-white hover:border-[var(--voyo-accent)]"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GuestOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--voyo-accent)]" />
      </div>
    }>
      <GuestOrderContent />
    </Suspense>
  );
}

