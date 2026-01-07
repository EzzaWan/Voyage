"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckCircle2, QrCode, Mail, ExternalLink, ArrowRight, Smartphone, Download, Clock, LogIn, UserPlus, AlertCircle, Link as LinkIcon, Loader2 } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusDisplay } from "@/lib/admin-helpers";
import { useToast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface OrderData {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
}

interface EsimProfile {
  id: string;
  iccid: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  esimStatus?: string | null;
}

interface OrderDetails extends OrderData {
  EsimProfile?: EsimProfile[];
  receiptSent?: boolean;
}

function GuestAccessRequest({ orderId, email }: { orderId: string; email: string }) {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const { toast } = useToast();

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await safeFetch(
        `${apiUrl}/orders/${orderId}/request-guest-access`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          errorMessage: 'Failed to send access link',
        }
      );
      setRequested(true);
      toast({
        title: 'Access link sent',
        description: 'Check your email for a secure link to view your order.',
      });
    } catch (error) {
      console.error('Failed to request access:', error);
    } finally {
      setRequesting(false);
    }
  };

  if (requested) {
    return (
      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <p className="text-sm text-green-400">
          ✓ Access link sent to {email}. Check your email for a secure link.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--voyage-border)]">
      <p className="text-xs text-[var(--voyage-muted)] mb-2">
        Need to access your order later? We can send you a secure link via email.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRequestAccess}
        disabled={requesting}
        className="border-[var(--voyage-border)] bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-card)] hover:text-white hover:border-[var(--voyage-accent)]"
      >
        {requesting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <LinkIcon className="mr-2 h-4 w-4" />
            Send Access Link
          </>
        )}
      </Button>
    </div>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: userLoaded } = useUser();
  const sessionId = searchParams.get('session_id');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [esimProfile, setEsimProfile] = useState<EsimProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversionFired, setConversionFired] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [orderEmail, setOrderEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || conversionFired) return;

    const fetchOrderAndFireConversion = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const order = await safeFetch<OrderData>(`${apiUrl}/orders/by-session/${sessionId}`, { showToast: false });

        if (order && order.id && order.amountCents) {
          // Fire conversion event
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'conversion', {
              'send_to': 'AW-17806579060/ND3BCMeJgNMbEPSq66pC',
              'value': order.amountCents / 100, // Convert cents to dollars
              'currency': order.currency?.toUpperCase() || 'USD',
              'transaction_id': order.id,
            });
            setConversionFired(true);
          }
          setOrderData(order);

          // Fetch eSIM profile if available (check order details endpoint)
          try {
            const orderDetails = await safeFetch<OrderDetails & { userEmail?: string }>(`${apiUrl}/orders/${order.id}`, { showToast: false });
            if (orderDetails?.EsimProfile && orderDetails.EsimProfile.length > 0) {
              setEsimProfile(orderDetails.EsimProfile[0]);
            }
            if (orderDetails?.receiptSent) {
              setEmailSent(true);
            }
            if (orderDetails?.userEmail) {
              setOrderEmail(orderDetails.userEmail);
              // Store email in localStorage for guest access
              localStorage.setItem('guest_checkout_email', orderDetails.userEmail);
            }
          } catch (err) {
            // Profile might not be ready yet, that's okay
            console.log('eSIM profile not yet available');
          }
        }
      } catch (error) {
        console.error('Failed to fetch order for conversion tracking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndFireConversion();
  }, [sessionId, conversionFired]);

  return (
    <>
      {/* Google Ads Conversion Script - fires when order data is loaded */}
      {orderData && typeof window !== 'undefined' && (
        <Script id="google-ads-conversion" strategy="afterInteractive">
          {`
            if (typeof gtag !== 'undefined') {
              gtag('event', 'conversion', {
                'send_to': 'AW-17806579060/ND3BCMeJgNMbEPSq66pC',
                'value': ${orderData.amountCents / 100},
                'currency': '${orderData.currency?.toUpperCase() || 'USD'}',
                'transaction_id': '${orderData.id}'
              });
            }
          `}
        </Script>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        <Breadcrumbs />
        {/* Success Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-white">Payment Successful!</h1>
          <p className="text-[var(--voyage-muted)] text-lg max-w-md">
            Your eSIM order has been confirmed and is being processed.
          </p>
        </div>

        {/* Order Details */}
        {orderData && (
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
            <CardHeader>
              <CardTitle className="text-white">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--voyage-muted)] mb-1">Order Number</p>
                  <p className="text-lg font-mono font-semibold text-white">{orderData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--voyage-muted)] mb-1">Amount Paid</p>
                  <p className="text-lg font-semibold text-[var(--voyage-accent)]">
                    {formatCurrency(orderData.amountCents / 100, orderData.currency || 'USD')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--voyage-muted)] mb-1">Order Status</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const statusDisplay = getOrderStatusDisplay(orderData.status);
                    // Extract color from className (e.g., "bg-green-500/20" -> "green-500")
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
        )}

        {/* QR Code & Installation */}
        {esimProfile && esimProfile.qrCodeUrl && (
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
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
                  className="flex-1 border-[var(--voyage-border)] bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-card)] hover:text-white hover:border-[var(--voyage-accent)]"
                  onClick={() => esimProfile.qrCodeUrl && window.open(esimProfile.qrCodeUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open QR Code
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[var(--voyage-border)] bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-card)] hover:text-white hover:border-[var(--voyage-accent)]"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = esimProfile.qrCodeUrl!;
                    link.download = `esim-qr-${orderData?.id}.png`;
                    link.click();
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <Link href={`/my-esims/${esimProfile.iccid}`} className="block">
                <Button className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
                  View Full Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Email Confirmation Status */}
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {emailSent ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-white">Confirmation email sent</p>
                    <p className="text-xs text-[var(--voyage-muted)]">Check your inbox for installation instructions</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-white">Email will be sent shortly</p>
                    <p className="text-xs text-[var(--voyage-muted)]">You'll receive installation instructions once your eSIM is ready</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Guide */}
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm text-[var(--voyage-text)]">
                <span className="font-medium text-white">Check your email</span> - You'll receive installation instructions with your QR code
              </li>
              <li className="text-sm text-[var(--voyage-text)]">
                <span className="font-medium text-white">Open Settings</span> on your device and go to Cellular/Mobile Data
              </li>
              <li className="text-sm text-[var(--voyage-text)]">
                <span className="font-medium text-white">Tap "Add Cellular Plan"</span> or "Add eSIM"
              </li>
              <li className="text-sm text-[var(--voyage-text)]">
                <span className="font-medium text-white">Scan the QR code</span> from your email or this page
              </li>
              <li className="text-sm text-[var(--voyage-text)]">
                <span className="font-medium text-white">Follow the on-screen instructions</span> to complete activation
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {userLoaded && (
          user ? (
            // Logged in user - show normal buttons
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/my-esims" className="flex-1">
                <Button className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white py-6 text-lg">
                  View My eSIMs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {orderData && (
                <Link href={`/my-esims?order=${orderData.id}`} className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full border-[var(--voyage-border)] bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-card)] hover:text-white hover:border-[var(--voyage-accent)] py-6 text-lg"
                  >
                    View Order
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            // Guest user - show login prompt
            <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[var(--voyage-accent)] mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">Login or create account to save your eSIM info</h3>
                      <p className="text-sm text-[var(--voyage-muted)]">
                        {orderEmail ? (
                          <>Use the email address <span className="text-white font-mono">{orderEmail}</span> that you used during checkout.</>
                        ) : (
                          <>Use the same email address that you used during checkout.</>
                        )}
                      </p>
                    </div>
                  </div>
                  {orderEmail && (
                    <Link href={`/my-esims?email=${encodeURIComponent(orderEmail)}`} className="block">
                      <Button className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white py-6 text-lg mb-3">
                        View My eSIMs
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout/success')}`} className="flex-1">
                      <Button className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white py-6 text-lg">
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href={`/sign-up?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout/success')}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full border-[var(--voyage-border)] bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-card)] hover:text-white hover:border-[var(--voyage-accent)] py-6 text-lg"
                      >
                        <UserPlus className="mr-2 h-5 w-5" />
                        Create Account
                      </Button>
                    </Link>
                  </div>
                  {orderData && orderEmail && (
                    <GuestAccessRequest orderId={orderData.id} email={orderEmail} />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-white">Loading...</h1>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
