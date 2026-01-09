"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Settings,
  QrCode,
  Copy,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface InstallStepsDialogProps {
  activationCode?: string | null;
  smdpAddress?: string | null;
  trigger?: React.ReactNode;
}

export function InstallStepsDialog({
  activationCode,
  smdpAddress,
  trigger,
}: InstallStepsDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<"ios" | "android" | null>(null);

  const extractSmdpFromAc = (ac: string | null | undefined): string | null => {
    if (!ac) return null;
    if (ac.includes("$")) {
      const parts = ac.split("$");
      return parts.length >= 2 ? parts[1] : null;
    }
    return null;
  };

  const extractActivationCodeFromAc = (ac: string | null | undefined): string | null => {
    if (!ac) return null;
    if (ac.includes("$")) {
      const parts = ac.split("$");
      return parts.length >= 3 ? parts[2] : null;
    }
    return ac;
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const smdpFromAc = extractSmdpFromAc(activationCode || null);
  const activationCodeOnly = extractActivationCodeFromAc(activationCode || null);
  const displaySmdp = smdpAddress || smdpFromAc || "Not available";

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <QrCode className="h-4 w-4" />
      How to Install
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">eSIM Installation Guide</DialogTitle>
          <DialogDescription>
            Follow these step-by-step instructions to install your eSIM on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            <Button
              variant={activeDevice === "ios" ? "default" : "outline"}
              onClick={() => setActiveDevice("ios")}
              className="flex-1"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              iPhone
            </Button>
            <Button
              variant={activeDevice === "android" ? "default" : "outline"}
              onClick={() => setActiveDevice("android")}
              className="flex-1"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Android
            </Button>
          </div>

          {(!activeDevice || activeDevice === "ios") && (
            <Card className="bg-[var(--voyo-bg-light)] border-[var(--voyo-border)]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-6 w-6 text-[var(--voyo-accent)]" />
                  <h3 className="text-xl font-bold text-white">iPhone Installation</h3>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Access Cellular Settings</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Go to <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Cellular</strong> (or Mobile Data) &gt; <strong className="text-white">Add eSIM</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Scan QR Code</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Select <strong className="text-white">Use QR Code</strong> and scan the code.
                      </p>
                      <div className="mt-2">
                         <p className="text-xs text-[var(--voyo-muted)] mb-1">
                           Can't scan? <strong className="text-white">Enter Details Manually</strong>:
                         </p>
                         <div className="bg-[var(--voyo-bg)] p-2 rounded border border-[var(--voyo-border)]">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-xs text-[var(--voyo-muted)]">SM-DP+:</span>
                             <button onClick={() => handleCopy(displaySmdp, "smdp")} className="text-xs text-[var(--voyo-accent)] hover:underline">
                               {copied === "smdp" ? "Copied" : "Copy"}
                             </button>
                           </div>
                           <code className="text-xs text-white block truncate mb-2">{displaySmdp}</code>
                           
                           {activationCodeOnly && (
                             <>
                               <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs text-[var(--voyo-muted)]">Code:</span>
                                 <button onClick={() => handleCopy(activationCodeOnly, "ac")} className="text-xs text-[var(--voyo-accent)] hover:underline">
                                   {copied === "ac" ? "Copied" : "Copy"}
                                 </button>
                               </div>
                               <code className="text-xs text-white block truncate">{activationCodeOnly}</code>
                             </>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Label Your eSIM</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Name your new plan (e.g., "Voyo") to easily identify it.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Set Default Line</h4>
                      <ul className="list-disc list-inside text-sm text-[var(--voyo-muted)] space-y-1">
                        <li><strong className="text-white">Default Line:</strong> Primary (keep for calls/SMS)</li>
                        <li><strong className="text-white">Cellular Data:</strong> Select your new eSIM</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      5
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Configure Network</h4>
                      <p className="text-[var(--voyo-muted)] mb-1">
                        In <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Cellular</strong> &gt; Your eSIM:
                      </p>
                      <ul className="list-disc list-inside text-sm text-[var(--voyo-muted)] space-y-1">
                        <li>Toggle <strong className="text-white">Data Roaming</strong> ON</li>
                        <li>Set <strong className="text-white">Network Selection</strong> to Automatic</li>
                        <li>Ensure <strong className="text-white">Voice & Data</strong> is LTE or 5G</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(!activeDevice || activeDevice === "android") && (
            <Card className="bg-[var(--voyo-bg-light)] border-[var(--voyo-border)]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-6 w-6 text-[var(--voyo-accent)]" />
                  <h3 className="text-xl font-bold text-white">Android Installation (Samsung / Pixel)</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Open Settings</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Open the <strong className="text-white">Settings</strong> app on your Android device.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Navigate to Connections</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Tap <strong className="text-white">Connections</strong> (Samsung) or <strong className="text-white">Network & internet</strong> (Pixel).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">SIM Manager</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Tap <strong className="text-white">SIM Manager</strong> or <strong className="text-white">SIMs</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Add eSIM</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Tap <strong className="text-white">Add eSIM</strong> or <strong className="text-white">Add mobile plan</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      5
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Scan QR Code or Enter Code</h4>
                      <p className="text-[var(--voyo-muted)] mb-2">
                        Choose one of these options:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-[var(--voyo-muted)] ml-2">
                        <li>
                          <strong className="text-white">Scan QR Code:</strong> Point your camera at the QR code
                        </li>
                        <li>
                          <strong className="text-white">Enter Activation Code:</strong> Manually enter the activation code
                        </li>
                      </ul>
                      {activationCodeOnly && (
                        <div className="mt-3">
                          <div className="p-3 bg-[var(--voyo-bg)] rounded-lg border border-[var(--voyo-border)]">
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-xs text-white font-mono break-all flex-1">
                                {activationCodeOnly}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(activationCodeOnly, "ac")}
                              >
                                {copied === "ac" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--voyo-accent)] text-white flex items-center justify-center font-bold">
                      6
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="text-white font-semibold">Complete Setup</h4>
                      <p className="text-[var(--voyo-muted)]">
                        Follow the on-screen prompts to complete the installation. Your eSIM will be activated once the download is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              <strong>Note:</strong> If you encounter any issues during installation, check our{" "}
              <a href="/support?tab=troubleshooting" className="underline hover:text-blue-300">
                troubleshooting guide
              </a>{" "}
              or{" "}
              <a href="/support/contact" className="underline hover:text-blue-300">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


