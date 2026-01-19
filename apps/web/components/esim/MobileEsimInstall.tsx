"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertCircle, QrCode, Copy, CheckCircle2 } from "lucide-react";
import { detectDevice, type DeviceInfo } from "@/lib/device-detection";
import { toast } from "@/components/ui/use-toast";

interface MobileEsimInstallProps {
  activationCode: string | null;
  qrCodeUrl?: string | null;
  onCopyActivation?: () => void;
  className?: string;
}

/**
 * Formats activation code into LPA link format
 * Expected format: LPA:1$rsp.example.com$ACTIVATION_CODE
 * If already in LPA format, returns as-is
 */
function formatLPALink(activationCode: string): string {
  // If already in LPA format, return as-is
  if (activationCode.startsWith('LPA:')) {
    return activationCode;
  }

  // If not in LPA format, return as-is (may be just the activation code)
  // The system should handle it appropriately
  return activationCode;
}

/**
 * Formats Android eSIM install link
 * Android supports both LPA links and esim:// protocol
 */
function formatAndroidEsimLink(activationCode: string): string {
  const lpaLink = formatLPALink(activationCode);
  
  // Try esim:// protocol (some Android devices support this)
  // Fallback to LPA link if esim:// doesn't work
  if (lpaLink.startsWith('LPA:')) {
    // Use LPA link directly for Android (most devices support it)
    return lpaLink;
  }
  
  // If not in LPA format, try esim:// protocol
  return `esim://install?code=${encodeURIComponent(lpaLink)}`;
}

export function MobileEsimInstall({
  activationCode,
  qrCodeUrl,
  onCopyActivation,
  className = "",
}: MobileEsimInstallProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [installAttempted, setInstallAttempted] = useState(false);

  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  if (!deviceInfo) {
    return null;
  }

  // Only show on mobile devices
  if (!deviceInfo.isMobile) {
    return null;
  }

  // If no activation code, show error state
  if (!activationCode || activationCode.trim().length === 0) {
    return (
      <div className={`bg-[var(--voyo-card)] rounded-xl border border-[var(--voyo-border)] p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white mb-1">
              Activation code unavailable
            </p>
            <p className="text-xs text-[var(--voyo-muted)]">
              Please contact support if you need assistance installing your eSIM.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyActivation = async () => {
    if (!activationCode) return;

    try {
      await navigator.clipboard.writeText(activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (onCopyActivation) {
        onCopyActivation();
      } else {
        toast({
          title: "Copied",
          description: "Activation code copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy activation code",
      });
    }
  };

  const handleInstallClick = () => {
    setInstallAttempted(true);
    // The actual navigation happens via the <a> tag href
    // This is just for tracking/UX purposes
  };

  const lpaLink = formatLPALink(activationCode);
  const installHref = deviceInfo.isIOS 
    ? lpaLink 
    : deviceInfo.isAndroid 
    ? formatAndroidEsimLink(activationCode)
    : lpaLink;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Helper text */}
      <p className="text-xs text-[var(--voyo-muted)] text-center">
        If you're viewing this on the phone you want to install the eSIM on, tap below.
      </p>

      {/* Install button */}
      <a
        href={installHref}
        onClick={handleInstallClick}
        className="block"
      >
        <Button
          variant="default"
          className="w-full bg-[var(--voyo-accent)] hover:bg-[var(--voyo-accent-soft)] text-white py-6 text-base font-semibold"
        >
          <Smartphone className="mr-2 h-5 w-5" />
          Install eSIM on this device
        </Button>
      </a>

      {/* Fallback instructions */}
      {installAttempted && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400 mb-2">
            If the install button didn't work, use one of these methods:
          </p>
          <ul className="text-xs text-[var(--voyo-muted)] space-y-1 list-disc list-inside">
            <li>Scan the QR code below</li>
            <li>Copy the activation code and enter it manually</li>
            <li>Check your email for installation instructions</li>
          </ul>
        </div>
      )}

      {/* Backup options */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--voyo-border)]">
        {qrCodeUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Scroll to QR code or show it
              const qrElement = document.querySelector('[data-qr-code]');
              if (qrElement) {
                qrElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="flex-1 border-[var(--voyo-border)] bg-[var(--voyo-bg-light)] text-white hover:bg-[var(--voyo-card)] hover:text-white hover:border-[var(--voyo-accent)]"
          >
            <QrCode className="mr-2 h-4 w-4" />
            View QR Code
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyActivation}
          className="flex-1 border-[var(--voyo-border)] bg-[var(--voyo-bg-light)] text-white hover:bg-[var(--voyo-card)] hover:text-white hover:border-[var(--voyo-accent)]"
        >
          {copied ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Activation Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

