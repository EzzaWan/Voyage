"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderData, setOrderData] = useState<any>(null);
  const [conversionFired, setConversionFired] = useState(false);

  useEffect(() => {
    if (!sessionId || conversionFired) return;

    const fetchOrderAndFireConversion = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const order = await safeFetch<{
          id: string;
          amountCents: number;
          currency: string;
        }>(`${apiUrl}/orders/by-session/${sessionId}`, { showToast: false });

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
        }
      } catch (error) {
        console.error('Failed to fetch order for conversion tracking:', error);
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

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-white">Payment Successful!</h1>
        <p className="text-[var(--voyage-muted)] text-lg max-w-md">
          Your eSIM order has been confirmed. You will receive an email with installation instructions shortly.
        </p>
        <Link href="/my-esims">
          <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white px-8 py-6 text-lg rounded-full">
            View My eSIMs
          </Button>
        </Link>
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
