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
 * Formats activation code into LPA string format
 * Expected format: LPA:1$rsp.example.com$ACTIVATION_CODE
 * If already in LPA format, returns as-is
 * 
 * @see https://esimaccess.com/new-apple-universal-link-for-esim-install/
 * @see https://esimaccess.com/new-android-universal-link-for-esim-installation/
 */
function formatLPAString(activationCode: string): string {
  // If already in LPA format, return as-is
  if (activationCode.startsWith('LPA:')) {
    return activationCode;
  }

  // If not in LPA format, return as-is (may be just the activation code)
  // The system should handle it appropriately
  return activationCode;
}

/**
 * Generates Apple Universal Link for eSIM installation
 * Format: https://esimsetup.apple.com/esim_qrcode_provisioning?carddata={LPA_STRING}
 * Requires iOS 17.4+
 * 
 * @see https://esimaccess.com/new-apple-universal-link-for-esim-install/
 */
function generateAppleUniversalLink(activationCode: string): string {
  const lpaString = formatLPAString(activationCode);
  // URL encode the LPA string for the carddata parameter
  const encodedLPA = encodeURIComponent(lpaString);
  return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodedLPA}`;
}

/**
 * Generates Android Universal Link for eSIM installation
 * Format: https://esimsetup.android.com/esim_qrcode_provisioning?carddata={LPA_STRING}
 * Requires Android 10+ with latest GMS and LPA updates
 * 
 * @see https://esimaccess.com/new-android-universal-link-for-esim-installation/
 */
function generateAndroidUniversalLink(activationCode: string): string {
  const lpaString = formatLPAString(activationCode);
  // URL encode the LPA string for the carddata parameter
  const encodedLPA = encodeURIComponent(lpaString);
  return `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodedLPA}`;
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

  // Generate Universal Link based on device type
  // Apple: https://esimsetup.apple.com/esim_qrcode_provisioning?carddata={LPA_STRING}
  // Android: https://esimsetup.android.com/esim_qrcode_provisioning?carddata={LPA_STRING}
  const installHref = deviceInfo.isIOS && deviceInfo.supportsUniversalLink
    ? generateAppleUniversalLink(activationCode)
    : deviceInfo.isAndroid && deviceInfo.supportsUniversalLink
    ? generateAndroidUniversalLink(activationCode)
    : null; // Fallback to QR code if Universal Links not supported

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Helper text */}
      <p className="text-xs text-[var(--voyo-muted)] text-center">
        {deviceInfo.isIOS 
          ? "Tap below to install directly on this iPhone (iOS 17.4+ required)."
          : deviceInfo.isAndroid
          ? "Tap below to install directly on this Android device (Android 10+ required)."
          : "If you're viewing this on the phone you want to install the eSIM on, tap below."}
      </p>

      {/* Install button - Only show if Universal Link is available */}
      {installHref ? (
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
            {deviceInfo.isIOS 
              ? "Install eSIM on this iPhone" 
              : deviceInfo.isAndroid 
              ? "Install eSIM on this Android device"
              : "Install eSIM on this device"}
          </Button>
        </a>
      ) : (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400 text-center">
            Universal Link installation requires {deviceInfo.isIOS ? 'iOS 17.4+' : 'Android 10+'}.
            Please use the QR code or activation code below.
          </p>
        </div>
      )}

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

