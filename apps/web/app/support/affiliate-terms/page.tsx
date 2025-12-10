import type { Metadata } from "next";
import { AffiliateTermsOfService } from "../sections/affiliate-terms";

export const metadata: Metadata = {
  title: "Affiliate Terms of Service — Voyage",
  description: "Rules, guidelines, and payout conditions for Voyage affiliates. Learn about commission structure, referral rules, holding periods, and payout policies.",
  openGraph: {
    title: "Affiliate Terms of Service — Voyage",
    description: "Rules, guidelines, and payout conditions for Voyage affiliates.",
  },
};

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        <AffiliateTermsOfService />
      </div>
    </div>
  );
}

