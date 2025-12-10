"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, FileText, Wrench, Smartphone, DollarSign, Scale, Mail, Users } from "lucide-react";
import { InstallGuides } from "./sections/install-guides";
import { Troubleshooting } from "./sections/troubleshooting";
import { RefundPolicy } from "./sections/refund-policy";
import { TermsOfService } from "./sections/terms";

function SupportContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(tabParam || "install");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Help Center</h1>
          <p className="text-[var(--voyage-muted)]">
            Find answers, installation guides, and get support
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-6">
            <TabsTrigger value="install" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Install Guides</span>
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden md:inline">Troubleshooting</span>
            </TabsTrigger>
            <TabsTrigger value="device" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden md:inline">Device Check</span>
            </TabsTrigger>
            <TabsTrigger value="refund" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Refund Policy</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden md:inline">Terms</span>
            </TabsTrigger>
            <TabsTrigger value="affiliate-terms" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Affiliate Terms</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">Contact</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="install">
            <InstallGuides />
          </TabsContent>

          <TabsContent value="troubleshooting">
            <Troubleshooting />
          </TabsContent>

          <TabsContent value="device">
            <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Compatibility Checker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--voyage-muted)] mb-4">
                  Check if your device supports eSIM before purchasing a plan.
                </p>
                <Link href="/support/device-check">
                  <button className="px-6 py-3 bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white rounded-lg font-medium transition-colors">
                    Check Device Compatibility
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refund">
            <RefundPolicy />
          </TabsContent>

          <TabsContent value="terms">
            <TermsOfService />
          </TabsContent>

          <TabsContent value="affiliate-terms">
            <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Affiliate Terms of Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--voyage-muted)] mb-4">
                  Rules, guidelines, and payout conditions for Voyage affiliates. Learn about commission structure, referral rules, holding periods, and payout policies.
                </p>
                <Link href="/support/affiliate-terms">
                  <button className="px-6 py-3 bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white rounded-lg font-medium transition-colors">
                    View Affiliate Terms of Service
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--voyage-muted)] mb-4">
                  Need help? Send us a message and we'll get back to you as soon as possible.
                </p>
                <Link href="/support/contact">
                  <button className="px-6 py-3 bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white rounded-lg font-medium transition-colors">
                    Open Contact Form
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Help Center</h1>
            <p className="text-[var(--voyage-muted)]">
              Find answers, installation guides, and get support
            </p>
          </div>
        </div>
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}

