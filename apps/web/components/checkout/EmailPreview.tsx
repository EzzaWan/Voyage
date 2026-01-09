"use client";

import { Mail, QrCode, Smartphone, Calendar, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailPreviewProps {
  planName?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  validityDays?: number;
  dataGB?: number;
  location?: string;
}

export function EmailPreview({
  planName = "Japan 3GB 15Days",
  orderId = "ORD-123456",
  amount = 5.10,
  currency = "USD",
  validityDays = 15,
  dataGB = 3,
  location = "Japan"
}: EmailPreviewProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-[var(--voyo-accent)]" />
          <CardTitle className="text-white">Order Confirmation Email Preview</CardTitle>
        </div>
        <p className="text-sm text-[var(--voyo-muted)] mt-2">
          This is what your confirmation email will look like
        </p>
      </CardHeader>
      <CardContent>
        <div className="bg-[var(--voyo-bg)] border border-[var(--voyo-border)] rounded-lg p-6 space-y-6">
          {/* Email Header */}
          <div className="border-b border-[var(--voyo-border)] pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-[var(--voyo-accent)]/20 flex items-center justify-center">
                <Globe className="h-4 w-4 text-[var(--voyo-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Voyo eSIM</p>
              </div>
            </div>
            <p className="text-xs text-[var(--voyo-muted)] mt-2">Order Confirmation - {orderId}</p>
          </div>

          {/* Email Body */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Thank you for your purchase!</h3>
              <p className="text-sm text-[var(--voyo-text)]">
                Your eSIM order has been confirmed. Here are your order details:
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-[var(--voyo-bg-light)] rounded-lg p-4 space-y-3 border border-[var(--voyo-border)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--voyo-muted)]">Plan</span>
                <span className="text-sm font-semibold text-white">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--voyo-muted)]">Location</span>
                <span className="text-sm font-semibold text-white">{location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--voyo-muted)]">Data</span>
                <span className="text-sm font-semibold text-white">{dataGB} GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--voyo-muted)]">Validity</span>
                <span className="text-sm font-semibold text-white">{validityDays} Days</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--voyo-border)]">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-[var(--voyo-accent)]">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-[var(--voyo-bg-light)] rounded-lg p-4 border border-[var(--voyo-border)]">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-4 w-4 text-[var(--voyo-accent)]" />
                <span className="text-sm font-semibold text-white">Installation QR Code</span>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center justify-center mb-3">
                <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-[var(--voyo-muted)]">
                Scan this QR code with your device to install your eSIM profile.
              </p>
            </div>

            {/* Installation Steps */}
            <div className="bg-[var(--voyo-bg-light)] rounded-lg p-4 border border-[var(--voyo-border)]">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-[var(--voyo-accent)]" />
                <span className="text-sm font-semibold text-white">Quick Setup Guide</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--voyo-text)]">
                <li>Open Settings on your device</li>
                <li>Go to Cellular/Mobile Data settings</li>
                <li>Tap "Add Cellular Plan" or "Add eSIM"</li>
                <li>Scan the QR code above</li>
                <li>Follow the on-screen instructions</li>
              </ol>
            </div>

            {/* Support Section */}
            <div className="pt-4 border-t border-[var(--voyo-border)]">
              <p className="text-xs text-[var(--voyo-muted)]">
                Need help? Visit our <a href="/support" className="text-[var(--voyo-accent)] hover:underline">Help Center</a>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


