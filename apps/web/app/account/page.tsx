"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ArrowRight } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
        <p className="text-[var(--voyage-muted)]">Manage your account settings</p>
      </div>

      {/* Affiliate Program Card */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-[var(--voyage-accent)]" />
            <CardTitle className="text-white">Affiliate Program</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--voyage-muted)]">
            Earn 10% lifetime commissions on all purchases from your referrals (initial eSIM purchases and top-ups).
            Share your unique referral link and start earning today!
          </p>
          <Link href="/account/affiliate">
            <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
              View Affiliate Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

