"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export function RefundPolicy() {
  return (
    <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
      <CardContent className="p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Refund Policy</h2>
          <p className="text-[var(--voyage-muted)]">
            We want you to be completely satisfied with your eSIM purchase. Please read our refund policy carefully.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Refund Conditions
            </h3>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 space-y-4">
              <p className="text-white font-semibold">Refunds are allowed ONLY if ALL of the following conditions are met:</p>
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">eSIM NOT installed:</strong> The eSIM profile has not been installed or activated on any device</li>
                <li><strong className="text-white">No data used:</strong> Zero data consumption has occurred on the eSIM</li>
                <li><strong className="text-white">eSIM ready but not activated:</strong> The eSIM must be ready for installation but not yet installed on any device</li>
                <li><strong className="text-white">Refund requested within validity period:</strong> Request must be made before the eSIM's validity period expires</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              Non-Refundable Situations
            </h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 space-y-4">
              <p className="text-white font-semibold">Refunds will NOT be provided in the following situations:</p>
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">eSIM already activated:</strong> Once the eSIM is installed and activated on a device</li>
                <li><strong className="text-white">Data has been used:</strong> Any data consumption has occurred, even if minimal</li>
                <li><strong className="text-white">Wrong device:</strong> You purchased for a device that doesn't support eSIM</li>
                <li><strong className="text-white">Wrong country/region:</strong> You purchased an eSIM for a different country than needed</li>
                <li><strong className="text-white">Poor local coverage:</strong> Network coverage issues at your location (check coverage maps before purchase)</li>
                <li><strong className="text-white">Validity expired:</strong> The eSIM's validity period has expired</li>
                <li><strong className="text-white">Change of mind:</strong> Simply deciding you don't need the eSIM anymore after purchase</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Refund Process
            </h3>
            <div className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-lg p-6 space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-[var(--voyage-muted)] ml-4">
                <li>
                  <strong className="text-white">Submit refund request:</strong> Contact our support team via the contact form with your order ID and reason
                </li>
                <li>
                  <strong className="text-white">Email verification:</strong> We'll verify your email address matches the order
                </li>
                <li>
                  <strong className="text-white">Review period:</strong> Our team will review your request within 24-48 hours
                </li>
                <li>
                  <strong className="text-white">Refund processing:</strong> If approved, refund will be processed within 3-5 business days
                </li>
                <li>
                  <strong className="text-white">Refund method:</strong> Refunds are issued to the original payment method used for purchase
                </li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Important Notes</h3>
            <div className="space-y-3 text-[var(--voyage-muted)]">
              <p>
                • All refund requests are reviewed on a case-by-case basis. We reserve the right to deny refunds that don't meet our policy criteria.
              </p>
              <p>
                • Refunds may take 3-5 business days to appear in your account after approval, depending on your bank or payment provider.
              </p>
              <p>
                • If you're unsure about device compatibility or coverage, please use our device checker and coverage information before purchasing.
              </p>
              <p>
                • Once an eSIM is activated and data is used, we cannot process a refund as the service has been consumed.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--voyage-border)]">
            <p className="text-[var(--voyage-muted)] mb-4">
              Need to request a refund or have questions about our policy?
            </p>
            <a href="/support/contact" className="inline-block">
              <button className="px-6 py-3 bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white rounded-lg font-medium transition-colors">
                Contact Support
              </button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

