"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, Info, Shield, DollarSign, Clock, FileText } from "lucide-react";
import Link from "next/link";

export function AffiliateTermsOfService() {
  return (
    <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
      <CardContent className="p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Affiliate Terms of Service</h2>
          <p className="text-[var(--voyage-muted)] mb-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-[var(--voyage-muted)]">
            By participating in the Voyage Affiliate Program, you agree to be bound by these terms. Please read them carefully.
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-[var(--voyage-accent)]" />
              1. Introduction
            </h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-7">
              <p>
                The Voyage Affiliate Program allows you to earn commissions by referring new customers to our eSIM marketplace. 
                These terms govern your participation in the program, including how referrals work, how commissions are calculated, 
                and the rules you must follow.
              </p>
              <p>
                Participation in the affiliate program is subject to Voyage's approval and ongoing compliance with these terms. 
                We reserve the right to modify these terms at any time.
              </p>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              2. Eligibility
            </h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-7">
              <p>To participate in the Voyage Affiliate Program, you must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Be at least 18 years old</li>
                <li>Have a valid Voyage account in good standing</li>
                <li>Provide accurate and complete information when enrolling</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not be a competitor of Voyage or engaged in any competing business</li>
              </ul>
              <p className="mt-3">
                Voyage reserves the right to deny or terminate affiliate status at its discretion, including if you violate 
                these terms or engage in fraudulent or harmful activities.
              </p>
            </div>
          </section>

          {/* Referral Rules */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              3. Referral Rules
            </h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 space-y-4">
              <p className="text-white font-semibold mb-3">Referral Code Usage Rules:</p>
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">One referral per user:</strong> Each new user can only be referred once. The first referral code they use is the one that counts, and no subsequent referral codes will be associated with their account.</li>
                <li><strong className="text-white">No self-referrals:</strong> You are strictly forbidden from referring yourself or creating accounts to refer yourself. This includes using different email addresses, devices, or payment methods to create fake referrals.</li>
                <li><strong className="text-white">No trading or selling:</strong> Referral codes cannot be traded, sold, bartered, or transferred to other parties. They are personal to your affiliate account.</li>
                <li><strong className="text-white">No coupon sites:</strong> You may not post your referral code on coupon sites, discount aggregators, or similar third-party platforms that list promotional codes.</li>
                <li><strong className="text-white">Genuine users only:</strong> Referrals must be genuine human users who sign up voluntarily. Referral codes cannot be used with bots, scripts, or automated systems.</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              4. Prohibited Activities
            </h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 space-y-4">
              <p className="text-white font-semibold mb-3">The following activities are strictly prohibited and will result in immediate account termination and forfeiture of all commissions:</p>
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">Creating multiple accounts:</strong> Creating multiple Voyage accounts to generate additional referrals or commissions</li>
                <li><strong className="text-white">Household referrals:</strong> Referring family members or individuals in the same household (determined at Voyage's discretion)</li>
                <li><strong className="text-white">Spamming referral links:</strong> Sending unsolicited emails, messages, or posting referral links in inappropriate places such as forums, comment sections, or social media without permission</li>
                <li><strong className="text-white">Incentivizing signups:</strong> Offering payments, rewards, or incentives to users in exchange for using your referral code (e.g., "Use my code and I'll pay you $5")</li>
                <li><strong className="text-white">Bots and automation:</strong> Using bots, scripts, automation tools, or any automated systems to generate referrals or simulate user activity</li>
                <li><strong className="text-white">VPNs, proxies, and Tor:</strong> Using VPNs, proxies, Tor networks, or any IP masking services to create false referrals or bypass fraud detection</li>
                <li><strong className="text-white">Paid traffic without approval:</strong> Purchasing ads or paid traffic to promote your referral link without explicit written approval from Voyage</li>
                <li><strong className="text-white">Coupon/discount sites:</strong> Posting your referral code on coupon sites, discount aggregators, or code-sharing platforms</li>
                <li><strong className="text-white">Misleading promotion:</strong> Sharing your referral code in misleading ways, such as claiming it provides discounts that don't exist or misrepresenting what Voyage offers</li>
                <li><strong className="text-white">Fake reviews or testimonials:</strong> Creating fake reviews, testimonials, or social media posts to promote your referral code</li>
                <li><strong className="text-white">Trademark infringement:</strong> Using Voyage's trademarks, logos, or brand assets without permission</li>
                <li><strong className="text-white">Identity deception:</strong> Impersonating Voyage staff, representatives, or official accounts</li>
              </ul>
              <p className="text-white font-semibold mt-4">
                Violation of any prohibited activity will result in immediate termination of your affiliate account, forfeiture of all unpaid commissions, and potential legal action.
              </p>
            </div>
          </section>

          {/* Commission Structure */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              5. Commission Structure
            </h3>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 space-y-4">
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">Commission rate:</strong> You earn 10% commission on all purchases made by users you refer</li>
                <li><strong className="text-white">Lifetime commissions:</strong> Commissions apply to all purchases made by referred users for as long as they remain active customers</li>
                <li><strong className="text-white">Order requirements:</strong> Commissions are only created when a referred user successfully completes a paid order. Failed payments, cancelled orders, or pending transactions do not generate commissions</li>
                <li><strong className="text-white">Commission reversal:</strong> If a referred user's order is refunded, the corresponding commission will be automatically reversed and deducted from your balance</li>
                <li><strong className="text-white">Available vs pending:</strong> Commissions start in "pending" status during the holding period, then transition to "available" status when you can request payout</li>
                <li><strong className="text-white">Top-ups included:</strong> Commissions are earned on both initial eSIM purchases and top-ups made by referred users</li>
                <li><strong className="text-white">Currency handling:</strong> Commissions are calculated and stored in USD, but you can view them in your selected currency on the dashboard</li>
              </ul>
            </div>
          </section>

          {/* Holding Period & Payout Rules */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              6. Holding Period & Payout Rules
            </h3>
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 space-y-4">
                <h4 className="text-white font-semibold">Holding Period</h4>
                <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                  <li><strong className="text-white">Duration:</strong> All commissions are subject to a minimum 7-day holding period from the date the commission is created</li>
                  <li><strong className="text-white">Purpose:</strong> The holding period prevents fraud, protects against order reversals, chargebacks, and refunds</li>
                  <li><strong className="text-white">Status:</strong> During the holding period, commissions appear as "pending" in your dashboard</li>
                  <li><strong className="text-white">Automatic transition:</strong> After the holding period expires, commissions automatically become "available" for payout</li>
                  <li><strong className="text-white">Configuration:</strong> The holding period duration is configurable by Voyage and may be adjusted based on business needs</li>
                </ul>
              </div>
              <div className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-lg p-6 space-y-4">
                <h4 className="text-white font-semibold">Payout Rules</h4>
                <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                  <li><strong className="text-white">Minimum threshold:</strong> A minimum payout threshold may apply (configurable by Voyage, currently defaults to $0)</li>
                  <li><strong className="text-white">Available balance only:</strong> You can only request payouts for commissions in "available" status, not "pending" commissions</li>
                  <li><strong className="text-white">Payout methods:</strong> Payouts can be requested via PayPal, bank transfer (IBAN/SWIFT), or converted to V-Cash (store credit)</li>
                  <li><strong className="text-white">Manual review:</strong> All payout requests are reviewed manually by Voyage staff before approval</li>
                  <li><strong className="text-white">Fraud risk:</strong> Voyage reserves the right to decline or hold payout requests if fraud risk is detected or if your account is under investigation</li>
                  <li><strong className="text-white">Valid information required:</strong> You must provide accurate and valid payout information. Invalid payment details will result in declined payout requests</li>
                  <li><strong className="text-white">Processing time:</strong> Approved payouts are typically processed within 3-5 business days, but may take longer depending on the payment method</li>
                  <li><strong className="text-white">One pending request:</strong> You can only have one pending payout request at a time</li>
                  <li><strong className="text-white">Payout statuses:</strong> Payout requests may be in "pending", "approved", "declined", or "paid" status</li>
                </ul>
              </div>
            </div>
          </section>

          {/* V-Cash Conversion Rules */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-400" />
              7. V-Cash Conversion Rules
            </h3>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 space-y-4">
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">Conversion is final:</strong> Converting commission to V-Cash is an irreversible transaction. Once converted, you cannot convert it back to cash or request a payout</li>
                <li><strong className="text-white">Instant availability:</strong> Converted commission becomes instantly available as V-Cash (store credit) in your account</li>
                <li><strong className="text-white">No cash value:</strong> V-Cash has no cash value and cannot be withdrawn or refunded. It can only be used to purchase eSIM plans and top-ups on the Voyage platform</li>
                <li><strong className="text-white">Available balance only:</strong> You can only convert commissions that are in "available" status (have passed the holding period)</li>
                <li><strong className="text-white">Partial conversion:</strong> You can convert any portion of your available commission balance to V-Cash, not necessarily the full amount</li>
                <li><strong className="text-white">No expiration:</strong> V-Cash does not expire and remains in your account until used</li>
              </ul>
            </div>
          </section>

          {/* Fraud Detection & Account Freeze */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-400" />
              8. Fraud Detection & Account Freeze
            </h3>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 space-y-4">
              <p className="text-white font-semibold mb-3">Voyage employs both automated and manual fraud detection systems:</p>
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">Automated checks:</strong> Our systems monitor for suspicious patterns, duplicate accounts, unusual referral patterns, and violations of these terms</li>
                <li><strong className="text-white">Manual review:</strong> Our team may manually review affiliate accounts, referral patterns, and payout requests</li>
                <li><strong className="text-white">Account freeze:</strong> If fraud is suspected, your affiliate account may be frozen pending investigation. During a freeze:
                  <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                    <li>You cannot request payouts</li>
                    <li>You cannot convert commissions to V-Cash</li>
                    <li>New commissions may still accrue but cannot be accessed until the freeze is lifted</li>
                    <li>You will be notified of the freeze via email</li>
                  </ul>
                </li>
                <li><strong className="text-white">Fraudulent referrals:</strong> Referrals flagged as fraudulent will not generate commissions, and existing commissions from those referrals may be reversed</li>
                <li><strong className="text-white">Investigation period:</strong> Account freezes and investigations may take several days to weeks to resolve</li>
                <li><strong className="text-white">Appeal process:</strong> You may appeal an account freeze or fraud determination through our dispute process (see Section 10)</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              9. Termination of Affiliate Account
            </h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 space-y-4">
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">Voyage's discretion:</strong> Voyage may terminate your affiliate account at its sole discretion, with or without cause, at any time</li>
                <li><strong className="text-white">Instant termination:</strong> Fraud, rule violations, prohibited activities, or violations of these terms may result in immediate termination without notice</li>
                <li><strong className="text-white">Commission forfeiture:</strong> Upon termination, you forfeit all unpaid commissions and pending payout requests. You will not receive payment for commissions that were pending or available at the time of termination</li>
                <li><strong className="text-white">Loss of eligibility:</strong> Once terminated, you lose all payout eligibility and cannot convert remaining commissions to V-Cash</li>
                <li><strong className="text-white">Referral link deactivation:</strong> Your referral code and referral link will be immediately deactivated and will no longer generate commissions</li>
                <li><strong className="text-white">No reinstatement:</strong> Terminated accounts generally cannot be reinstated. Voyage's decision to terminate is final</li>
                <li><strong className="text-white">Reapplication:</strong> You may not reapply for the affiliate program after termination without Voyage's explicit written permission</li>
              </ul>
            </div>
          </section>

          {/* Dispute Handling / Appeals */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              10. Dispute Handling / Appeals
            </h3>
            <div className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-lg p-6 space-y-4">
              <ul className="list-disc list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                <li><strong className="text-white">Appeal window:</strong> If you disagree with a decision regarding your affiliate account, payout request, or account freeze, you may appeal within 14 days of the decision</li>
                <li><strong className="text-white">Appeal method:</strong> Appeals must be submitted through our support contact form at <Link href="/support/contact" className="text-[var(--voyage-accent)] hover:underline">/support/contact</Link> with the subject "Affiliate Appeal"</li>
                <li><strong className="text-white">Required information:</strong> Your appeal must include your affiliate code, email address, a detailed explanation of why you believe the decision was incorrect, and any supporting evidence</li>
                <li><strong className="text-white">Manual review:</strong> Appeals are reviewed manually by Voyage staff. The review process may take 5-10 business days</li>
                <li><strong className="text-white">No guarantee:</strong> Submitting an appeal does not guarantee reversal of the decision</li>
                <li><strong className="text-white">Final decision:</strong> Voyage's decision on appeals is final and binding. There is no further appeal process</li>
                <li><strong className="text-white">One appeal per decision:</strong> You may only submit one appeal per decision or action</li>
              </ul>
            </div>
          </section>

          {/* Tax Responsibilities */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">11. Tax Responsibilities</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Your responsibility:</strong> You are solely responsible for declaring and paying all taxes on your affiliate earnings in your jurisdiction</li>
                <li><strong className="text-white">Tax advice:</strong> Voyage does not provide tax advice. Consult with a qualified tax professional for guidance on reporting affiliate income</li>
                <li><strong className="text-white">No tax withholding:</strong> Voyage does not withhold taxes from affiliate payouts unless required by law</li>
                <li><strong className="text-white">Tax forms:</strong> You may be required to provide tax identification information depending on your location and payout amount</li>
                <li><strong className="text-white">Record keeping:</strong> You should maintain records of all commission earnings and payout transactions for tax purposes</li>
              </ul>
            </div>
          </section>

          {/* Data Processing & Privacy */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">12. Data Processing & Privacy</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Privacy policy:</strong> All data processing related to the affiliate program is governed by Voyage's Privacy Policy</li>
                <li><strong className="text-white">Data collection:</strong> Voyage collects and processes data necessary to operate the affiliate program, including referral tracking, commission calculations, and payout processing</li>
                <li><strong className="text-white">Data sharing:</strong> We may share affiliate data with payment processors, fraud detection services, and other service providers necessary to operate the program</li>
                <li><strong className="text-white">Confidentiality:</strong> You agree to keep confidential any non-public information about Voyage's business, customers, or operations that you may learn through your participation in the program</li>
              </ul>
            </div>
          </section>

          {/* Modifications to This Agreement */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">13. Modifications to This Agreement</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Right to modify:</strong> Voyage reserves the right to modify these Affiliate Terms of Service at any time, with or without notice</li>
                <li><strong className="text-white">Notification:</strong> We will attempt to notify affiliates of significant changes via email, but it is your responsibility to review these terms periodically</li>
                <li><strong className="text-white">Continued participation:</strong> Your continued participation in the affiliate program after modifications are posted constitutes acceptance of the modified terms</li>
                <li><strong className="text-white">Disagreement:</strong> If you do not agree to modified terms, you must terminate your participation in the affiliate program immediately</li>
                <li><strong className="text-white">Effective date:</strong> Modifications become effective immediately upon posting unless otherwise specified</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-3">14. Contact Information</h3>
            <div className="text-[var(--voyage-muted)] space-y-2 ml-4">
              <p>For questions about the Affiliate Program or these terms, please contact us:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Support: <Link href="/support/contact" className="text-[var(--voyage-accent)] hover:underline">Contact Form</Link></li>
                <li>Affiliate Dashboard: <Link href="/account/affiliate" className="text-[var(--voyage-accent)] hover:underline">/account/affiliate</Link></li>
              </ul>
            </div>
          </section>
        </div>

        <div className="pt-6 border-t border-[var(--voyage-border)]">
          <p className="text-[var(--voyage-muted)] mb-4">
            By participating in the Voyage Affiliate Program, you acknowledge that you have read, understood, and agree to be bound by these Affiliate Terms of Service. 
            If you do not agree to these terms, please do not participate in the affiliate program.
          </p>
          <div className="flex gap-4">
            <Link href="/account/affiliate">
              <button className="px-6 py-3 bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white rounded-lg font-medium transition-colors">
                Go to Affiliate Dashboard
              </button>
            </Link>
            <Link href="/support/contact">
              <button className="px-6 py-3 bg-[var(--voyage-bg-light)] hover:bg-[var(--voyage-card)] border border-[var(--voyage-border)] text-white rounded-lg font-medium transition-colors">
                Contact Support
              </button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

