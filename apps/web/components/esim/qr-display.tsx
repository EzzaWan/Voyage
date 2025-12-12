"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Smartphone,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";

interface QRDisplayProps {
  qrCodeUrl: string | null;
  activationCode: string | null;
  iccid: string;
  esimStatus?: string;
  smdpStatus?: string;
  onRegenerate?: () => Promise<void>;
  planName?: string;
  showDeviceCheck?: boolean;
}

export function QRDisplay({
  qrCodeUrl,
  activationCode,
  iccid,
  esimStatus,
  smdpStatus,
  onRegenerate,
  planName,
  showDeviceCheck = false,
}: QRDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (qrCodeUrl) {
      setQrLoading(true);
      setQrError(false);
    }
  }, [qrCodeUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!qrContainerRef.current) return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        handleDownload();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (activationCode) handleCopyActivation();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activationCode]);

  const toggleFullscreen = async () => {
    if (!qrContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await qrContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast({
        variant: "destructive",
        title: "Fullscreen Error",
        description: "Failed to toggle fullscreen mode",
      });
    }
  };

  const handleDownload = async () => {
    if (!qrCodeUrl || !qrContainerRef.current) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const proxyUrl = qrCodeUrl.startsWith("http") && apiUrl
        ? `${apiUrl}/esims/${iccid}/qr-image`
        : qrCodeUrl;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to fetch QR image");

      const blob = await response.blob();
      saveAs(blob, `voyage-esim-${iccid}.png`);

      toast({
        title: "Downloaded",
        description: "QR code saved to your device",
      });
    } catch (error) {
      console.error("Download error:", error);
      
      if (qrContainerRef.current) {
        try {
          const dataUrl = await toPng(qrContainerRef.current, {
            backgroundColor: "#ffffff",
            quality: 1.0,
            pixelRatio: 2,
          });

          const link = document.createElement("a");
          link.download = `voyage-esim-${iccid}.png`;
          link.href = dataUrl;
          link.click();

          toast({
            title: "Downloaded",
            description: "QR code saved to your device",
          });
        } catch (pngError) {
          console.error("PNG conversion error:", pngError);
          toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Failed to download QR code. Please try again.",
          });
        }
      }
    }
  };

  const handlePrint = () => {
    if (!qrCodeUrl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: "Please allow popups to print the QR code",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voyage eSIM QR Code - ${iccid}</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: white;
              font-family: system-ui, -apple-system, sans-serif;
            }
            h1 {
              margin: 0 0 20px 0;
              color: #1a1a1a;
              font-size: 24px;
              text-align: center;
            }
            .qr-container {
              background: white;
              padding: 20px;
              border: 2px solid #ddd;
              border-radius: 8px;
              max-width: 500px;
            }
            .qr-container img {
              width: 100%;
              height: auto;
              display: block;
            }
            .info {
              margin-top: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
              .qr-container { border: none; }
            }
          </style>
        </head>
        <body>
          <h1>${planName || "Voyage eSIM"} - Installation QR Code</h1>
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="eSIM QR Code" />
          </div>
          <div class="info">
            <p>ICCID: ${iccid}</p>
            <p>Scan this QR code with your device to install the eSIM</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyQRUrl = async () => {
    if (!qrCodeUrl) return;

    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      setCopied("qr-url");
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Copied",
        description: "QR code URL copied to clipboard",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy QR code URL",
      });
    }
  };

  const handleCopyActivation = async () => {
    if (!activationCode) return;

    try {
      await navigator.clipboard.writeText(activationCode);
      setCopied("ac");
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Copied",
        description: "Activation code copied to clipboard",
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy activation code",
      });
    }
  };

  const handleSaveToDevice = async () => {
    if (!qrCodeUrl) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const proxyUrl = qrCodeUrl.startsWith("http") && apiUrl
        ? `${apiUrl}/esims/${iccid}/qr-image`
        : qrCodeUrl;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to fetch QR image");

      const blob = await response.blob();
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `voyage-esim-${iccid}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Saved",
        description: "QR code saved to your device",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save QR code",
      });
    }
  };

  const isMobile = typeof window !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const isExpired = esimStatus === "UNUSED_EXPIRED";
  const isAlreadyInstalled = smdpStatus === "DOWNLOADED" || smdpStatus === "INSTALLED";

  if (isExpired) {
    return (
      <div className="bg-[var(--voyage-card)] rounded-xl border border-red-500/30 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">QR Code Expired</h3>
            <p className="text-[var(--voyage-muted)] mb-4">
              This eSIM QR code has expired and can no longer be used for installation.
            </p>
            <Button
              onClick={() => window.location.href = "/"}
              className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
            >
              Buy New Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAlreadyInstalled && !qrCodeUrl) {
    return (
      <div className="bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)] p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">eSIM Already Installed</h3>
          {activationCode && (
            <div className="p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
              <p className="text-xs text-[var(--voyage-muted)] mb-2">Activation Code:</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-white font-mono break-all flex-1">
                  {activationCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyActivation}
                  className="flex-shrink-0"
                >
                  {copied === "ac" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (qrError || !qrCodeUrl) {
    return (
      <div className="bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)] p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">QR Code Not Available</h3>
              <p className="text-[var(--voyage-muted)] mb-4">
                The QR code could not be loaded. Please use the activation code below or contact support.
              </p>
            </div>
          </div>

          {activationCode && (
            <div className="p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
              <p className="text-xs text-[var(--voyage-muted)] mb-2">Activation Code:</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-white font-mono break-all flex-1">
                  {activationCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyActivation}
                  className="flex-shrink-0"
                >
                  {copied === "ac" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="outline"
              className="w-full"
            >
              Try Regenerating QR Code
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={qrContainerRef}
      className={`bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)] p-6 ${
        isFullscreen
          ? "fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-8"
          : ""
      }`}
    >
      {showDeviceCheck && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Your device might not support eSIM.{" "}
              <a
                href="/support/device-check"
                className="underline hover:text-yellow-300"
              >
                Check compatibility →
              </a>
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg flex items-center justify-center relative min-h-[300px]">
          {qrLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--voyage-muted)]" />
            </div>
          )}
          <Image
            ref={qrImageRef}
            src={qrCodeUrl}
            alt="eSIM QR Code"
            width={400}
            height={400}
            className={`w-full h-auto max-w-md ${qrLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
            onLoad={() => setQrLoading(false)}
            onError={() => {
              setQrLoading(false);
              setQrError(true);
            }}
            priority
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">DL</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-2"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyQRUrl}
            className="flex items-center gap-2"
          >
            {copied === "qr-url" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy URL</span>
              </>
            )}
          </Button>

          {activationCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyActivation}
              className="flex items-center gap-2"
            >
              {copied === "ac" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy AC</span>
                </>
              )}
            </Button>
          )}

          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToDevice}
              className="flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          )}
        </div>

        <div className="text-center text-xs text-[var(--voyage-muted)] pt-2">
          <p>Keyboard shortcuts: F (fullscreen) • D (download) • P (print) • C (copy activation)</p>
        </div>

        {activationCode && (
          <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
            <p className="text-xs text-[var(--voyage-muted)] mb-2">Activation Code:</p>
            <code className="text-sm text-white font-mono break-all block">
              {activationCode}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}


