"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, CheckCircle2, Smartphone, AlertTriangle, ChevronDown, QrCode } from "lucide-react";
import Link from "next/link";

export function InstallGuides() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exampleSmdp = "LPA:1$rsp-eu.redteamobile.com$451F9802E6";
  const exampleAc = "LPA:1$rsp-eu.redteamobile.com$451F9802E6";

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-[var(--voyage-muted)]">
          Follow these step-by-step guides to install your eSIM on your device. Installation usually takes less than 5 minutes.
        </p>
        <Link href="/support/device-check" className="inline-block mt-4">
          <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
            <Smartphone className="h-4 w-4 mr-2" />
            Check if your device supports eSIM
          </Button>
        </Link>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* iPhone Installation */}
        <AccordionItem value="iphone">
          <AccordionTrigger className="text-white text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              iPhone Installation Guide
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] mt-4">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Scan QR Code (Recommended)</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        If you received a QR code, this is the easiest method:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                        <li>Open your <strong className="text-white">Settings</strong> app</li>
                        <li>Tap <strong className="text-white">Cellular</strong> or <strong className="text-white">Mobile Data</strong></li>
                        <li>Tap <strong className="text-white">Add Cellular Plan</strong> or <strong className="text-white">Add eSIM</strong></li>
                        <li>Point your camera at the QR code shown in your Voyage account</li>
                        <li>Follow the on-screen prompts to complete installation</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Manual Entry (Alternative)</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        If QR code scanning doesn't work, you can enter the details manually:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                        <li>Go to <strong className="text-white">Settings</strong> → <strong className="text-white">Cellular</strong></li>
                        <li>Tap <strong className="text-white">Add Cellular Plan</strong></li>
                        <li>Tap <strong className="text-white">Enter Details Manually</strong></li>
                        <li>Enter the SM-DP+ address from your eSIM details</li>
                        <li>Enter the activation code (AC) when prompted</li>
                        <li>Complete the setup process</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Using SM-DP+ Address</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        You'll find your SM-DP+ address in your eSIM details. It looks like:
                      </p>
                      <div className="bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-lg p-4 flex items-center justify-between">
                        <code className="text-sm text-[var(--voyage-muted)] font-mono break-all">
                          {exampleSmdp}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(exampleSmdp, "smdp")}
                          className="ml-2"
                        >
                          {copied === "smdp" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Activation Code</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        Your activation code will be provided in your eSIM details:
                      </p>
                      <div className="bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-lg p-4 flex items-center justify-between">
                        <code className="text-sm text-[var(--voyage-muted)] font-mono break-all">
                          {exampleAc}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(exampleAc, "ac")}
                          className="ml-2"
                        >
                          {copied === "ac" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-1">Important Notes</h4>
                      <ul className="text-sm text-[var(--voyage-muted)] space-y-1">
                        <li>• Ensure you have a stable internet connection (Wi-Fi recommended)</li>
                        <li>• Keep your phone unlocked during installation</li>
                        <li>• Some iPhone models may require iOS 12.1 or later</li>
                        <li>• China/Hong Kong iPhone models may not support eSIM</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--voyage-border)]">
                  <Link href="/support?tab=troubleshooting">
                    <Button variant="outline" className="border-[var(--voyage-border)] text-white hover:bg-[var(--voyage-bg-light)]">
                      Having issues? Check Troubleshooting →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Android Installation */}
        <AccordionItem value="android">
          <AccordionTrigger className="text-white text-xl font-semibold">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              Android Installation Guide (Samsung, Google Pixel, etc.)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] mt-4">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Scan QR Code</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        For most Android devices with eSIM support:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                        <li>Open <strong className="text-white">Settings</strong></li>
                        <li>Tap <strong className="text-white">Connections</strong> or <strong className="text-white">Network & Internet</strong></li>
                        <li>Tap <strong className="text-white">SIM card manager</strong> or <strong className="text-white">Mobile networks</strong></li>
                        <li>Tap <strong className="text-white">Add mobile plan</strong> or <strong className="text-white">Add eSIM</strong></li>
                        <li>Select <strong className="text-white">Scan QR code</strong> and scan the QR code from your Voyage account</li>
                        <li>Follow the on-screen instructions</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Samsung Devices</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        For Samsung Galaxy devices:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                        <li>Open <strong className="text-white">Settings</strong> → <strong className="text-white">Connections</strong></li>
                        <li>Tap <strong className="text-white">SIM card manager</strong></li>
                        <li>Tap <strong className="text-white">Add mobile plan</strong></li>
                        <li>Select <strong className="text-white">Add using QR code</strong></li>
                        <li>Scan the QR code from your Voyage account</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Google Pixel</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        For Google Pixel devices:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                        <li>Open <strong className="text-white">Settings</strong> → <strong className="text-white">Network & Internet</strong></li>
                        <li>Tap <strong className="text-white">Mobile network</strong> → <strong className="text-white">+</strong></li>
                        <li>Tap <strong className="text-white">Download a SIM instead?</strong></li>
                        <li>Select <strong className="text-white">Next</strong> and scan the QR code</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">APN Settings (If Needed)</h3>
                      <p className="text-[var(--voyage-muted)] mb-3">
                        Some networks require manual APN configuration:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-[var(--voyage-muted)] ml-4">
                        <li>Go to <strong className="text-white">Settings</strong> → <strong className="text-white">Network & Internet</strong></li>
                        <li>Tap your eSIM → <strong className="text-white">Access Point Names</strong></li>
                        <li>Tap <strong className="text-white">+</strong> to add a new APN</li>
                        <li>Enter APN name: <strong className="text-white">internet</strong></li>
                        <li>Save and select the new APN</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-1">Dual SIM Behavior</h4>
                      <ul className="text-sm text-[var(--voyage-muted)] space-y-1">
                        <li>• You can use both physical SIM and eSIM simultaneously</li>
                        <li>• Choose which SIM to use for calls, messages, and data</li>
                        <li>• Some Android devices may require you to set a default data SIM</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--voyage-border)]">
                  <Link href="/support?tab=troubleshooting">
                    <Button variant="outline" className="border-[var(--voyage-border)] text-white hover:bg-[var(--voyage-bg-light)]">
                      Having issues? Check Troubleshooting →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

