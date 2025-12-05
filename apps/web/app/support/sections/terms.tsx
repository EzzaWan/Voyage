"use client";

import { Card, CardContent } from "@/components/ui/card";

export function TermsOfService() {
  return (
    <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
      <CardContent className="p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Terms of Service</h2>
          <p className="text-[var(--voyage-muted)] mb-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-[var(--voyage-muted)]">
            Please read these Terms of Service carefully before using Voyage eSIM services.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">1. Definitions</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p><strong className="text-white">"Voyage"</strong> refers to our eSIM marketplace platform and services.</p>
              <p><strong className="text-white">"eSIM"</strong> refers to the electronic SIM profile provided through our platform.</p>
              <p><strong className="text-white">"Service"</strong> refers to the eSIM data packages and related services we provide.</p>
              <p><strong className="text-white">"User"</strong> refers to any person or entity using our services.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">2. Account Requirements</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• You must be at least 18 years old to create an account and purchase eSIMs.</p>
              <p>• You are responsible for maintaining the confidentiality of your account credentials.</p>
              <p>• You must provide accurate and complete information when creating an account.</p>
              <p>• You are responsible for all activities that occur under your account.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">3. Usage Rules</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• eSIMs are for personal use only and may not be resold or transferred to third parties.</p>
              <p>• You must use the eSIM in accordance with applicable local laws and regulations.</p>
              <p>• You are responsible for ensuring your device is compatible with eSIM technology.</p>
              <p>• Data usage is subject to fair use policies and may be throttled if excessive.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">4. Restrictions</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• You may not use our services for illegal activities or in violation of any laws.</p>
              <p>• You may not attempt to hack, disrupt, or interfere with our platform or services.</p>
              <p>• You may not reverse engineer or attempt to extract eSIM data for unauthorized use.</p>
              <p>• You may not use automated systems to purchase or manage eSIMs without permission.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">5. Refund Rules</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• Refunds are only available if the eSIM has not been installed and no data has been used.</p>
              <p>• Refund requests must be made before the eSIM's validity period expires.</p>
              <p>• Refunds are processed within 3-5 business days after approval.</p>
              <p>• Please refer to our detailed Refund Policy for complete terms.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">6. Top-Up Rules</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• Top-ups extend your eSIM's validity and add data to your existing profile.</p>
              <p>• Top-up purchases are final and non-refundable once processed.</p>
              <p>• Top-ups must be purchased before your current eSIM expires.</p>
              <p>• Data from top-ups is added to your existing data allowance.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">7. Liability Limitations</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• Voyage provides eSIM services "as is" without warranties of any kind.</p>
              <p>• We are not responsible for network coverage, signal strength, or connectivity issues.</p>
              <p>• We are not liable for any damages resulting from the use or inability to use our services.</p>
              <p>• Our liability is limited to the amount you paid for the specific eSIM in question.</p>
              <p>• We are not responsible for device compatibility issues - users must verify compatibility before purchase.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">8. Service Availability</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• We reserve the right to modify, suspend, or discontinue services at any time.</p>
              <p>• Network coverage and speeds vary by location and are subject to local operator capabilities.</p>
              <p>• We do not guarantee uninterrupted or error-free service.</p>
              <p>• Some countries or regions may have restrictions on eSIM usage.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">9. Payment Terms</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>• All prices are displayed in USD, with local currency conversion available.</p>
              <p>• Payments are processed securely through our payment partners.</p>
              <p>• You authorize us to charge your payment method for all purchases.</p>
              <p>• All sales are final unless a refund is approved per our refund policy.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-3">10. Contact Information</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>For questions about these Terms of Service, please contact us:</p>
              <p>• Support: <a href="/support/contact" className="text-[var(--voyage-accent)] hover:underline">Contact Form</a></p>
              <p>• Email: Available through our support contact form</p>
            </div>
          </section>
        </div>

        <div className="pt-6 border-t border-[var(--voyage-border)]">
          <p className="text-[var(--voyage-muted)]">
            By using Voyage services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


