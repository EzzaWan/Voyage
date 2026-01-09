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
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Help Center</h1>
          <p className="text-sm md:text-base text-[var(--voyo-muted)]">
            Find answers, installation guides, and get support
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4 lg:grid-cols-7 gap-1 md:gap-2">
              <TabsTrigger value="install" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Install Guides</span>
                <span className="sm:hidden">Install</span>
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <Wrench className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Troubleshooting</span>
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              <TabsTrigger value="device" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <Smartphone className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Device Check</span>
                <span className="sm:hidden">Device</span>
              </TabsTrigger>
              <TabsTrigger value="refund" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Refund Policy</span>
                <span className="sm:hidden">Refund</span>
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <Scale className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Terms</span>
                <span className="sm:hidden">Terms</span>
              </TabsTrigger>
              <TabsTrigger value="affiliate-terms" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="hidden lg:inline">Affiliate Terms</span>
                <span className="hidden sm:inline lg:hidden">Affiliate</span>
                <span className="sm:hidden">Affiliate</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 h-auto">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Contact</span>
                <span className="sm:hidden">Contact</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="install">
            <InstallGuides />
          </TabsContent>

          <TabsContent value="troubleshooting">
            <Troubleshooting />
          </TabsContent>

          <TabsContent value="device">
            <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Compatibility Checker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--voyo-muted)] mb-4">
                  Check if your device supports eSIM before purchasing a plan.
                </p>
                <Link href="/support/device-check">
                  <button className="px-6 py-3 bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white rounded-lg font-medium transition-colors">
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
            <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Affiliate Terms of Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--voyo-muted)] mb-4">
                  Rules, guidelines, and payout conditions for Voyo affiliates. Learn about commission structure, referral rules, holding periods, and payout policies.
                </p>
                <Link href="/support/affiliate-terms">
                  <button className="px-6 py-3 bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white rounded-lg font-medium transition-colors">
                    View Affiliate Terms of Service
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="bg-[var(--voyo-card)] border-[var(--voyo-border)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--voyo-muted)] mb-4">
                  Need help? Send us a message and we'll get back to you as soon as possible.
                </p>
                <Link href="/support/contact">
                  <button className="px-6 py-3 bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white rounded-lg font-medium transition-colors">
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
      <div className="min-h-screen py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Help Center</h1>
            <p className="text-sm md:text-base text-[var(--voyo-muted)]">
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

