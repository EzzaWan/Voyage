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
              <CardContent className="p-6 space-y-8">
                
                {/* Before You Begin */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Before You Begin</h4>
                  <ul className="list-disc list-inside text-sm text-[var(--voyage-muted)] space-y-1">
                    <li>Ensure your iPhone is unlocked and supports eSIM (iPhone XS and newer).</li>
                    <li>Make sure you have a stable Wi-Fi or cellular data connection.</li>
                    <li>Have your eSIM QR code or activation details ready.</li>
                  </ul>
                </div>

                {/* Method 1: QR Code */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Method 1: Install using QR Code (Recommended)</h3>
                  <div className="space-y-6">
                    
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">1</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Access Cellular Settings</h4>
                        <p className="text-[var(--voyage-muted)] mb-2">
                          Open <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Cellular</strong> (or <strong className="text-white">Mobile Data</strong>) &gt; <strong className="text-white">Add eSIM</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">2</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Scan QR Code</h4>
                        <p className="text-[var(--voyage-muted)] mb-2">
                          Select <strong className="text-white">Use QR Code</strong> and scan the code provided in your Voyage account.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">3</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Label Your eSIM</h4>
                        <p className="text-[var(--voyage-muted)] mb-2">
                          Give your new eSIM a name like "Travel" or "Voyage" to identify it easily.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">4</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Set Default Line Preferences</h4>
                        <p className="text-[var(--voyage-muted)] mb-2">
                          <ul className="list-disc list-inside space-y-1 ml-1">
                            <li><strong className="text-white">Default Line:</strong> Primary (for calls/SMS)</li>
                            <li><strong className="text-white">Cellular Data:</strong> Select your new eSIM</li>
                          </ul>
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">5</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Configure Network Settings</h4>
                        <p className="text-[var(--voyage-muted)] mb-2">
                          Go to <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Cellular</strong> &gt; Select your new eSIM:
                        </p>
                        <ul className="list-disc list-inside text-[var(--voyage-muted)] space-y-1 ml-1">
                          <li>Turn <strong className="text-white">Data Roaming</strong> ON.</li>
                          <li>Ensure <strong className="text-white">Network Selection</strong> is set to Automatic.</li>
                          <li>In <strong className="text-white">Voice & Data</strong>, select LTE or 5G.</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="w-full h-px bg-[var(--voyage-border)]"></div>

                {/* Method 2: Manual */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Method 2: Manual Entry (Alternative)</h3>
                  <div className="space-y-6">
                    <p className="text-[var(--voyage-muted)]">If you cannot scan the QR code, enter details manually.</p>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">1</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Enter Details Manually</h4>
                        <p className="text-[var(--voyage-muted)] mb-2">
                          Go to <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Cellular</strong> &gt; <strong className="text-white">Add eSIM</strong> &gt; <strong className="text-white">Enter Details Manually</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">2</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Copy & Paste Info</h4>
                        <p className="text-[var(--voyage-muted)] mb-3">
                          Copy the SM-DP+ Address and Activation Code from your Voyage account:
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-[var(--voyage-muted)] block mb-1">SM-DP+ Address</span>
                            <div className="bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-lg p-3 flex items-center justify-between">
                              <code className="text-sm text-[var(--voyage-muted)] font-mono truncate mr-2">
                                {exampleSmdp}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(exampleSmdp, "smdp")}
                                className="h-8 w-8 p-0"
                              >
                                {copied === "smdp" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs text-[var(--voyage-muted)] block mb-1">Activation Code</span>
                            <div className="bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-lg p-3 flex items-center justify-between">
                              <code className="text-sm text-[var(--voyage-muted)] font-mono truncate mr-2">
                                {exampleAc}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(exampleAc, "ac")}
                                className="h-8 w-8 p-0"
                              >
                                {copied === "ac" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyage-accent)] text-white flex items-center justify-center font-bold">3</div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Finish Setup</h4>
                        <p className="text-[var(--voyage-muted)]">
                          Follow the prompts to label your plan and configure network settings as shown in Method 1 (Steps 3-5).
                        </p>
                      </div>
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

