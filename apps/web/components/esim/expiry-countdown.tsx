"use client";

import { useState, useEffect, useRef } from "react";
import {
  getTimeRemaining,
  formatRemainingShort,
  getUrgencyLevel,
  formatFullExpiryDate,
  TimeRemaining,
  UrgencyLevel,
} from "@/lib/format-expiry";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";

interface ExpiryCountdownProps {
  expiry: string | Date | null | undefined;
  className?: string;
  iccid?: string;
  onExpired?: () => void;
}

export function ExpiryCountdown({
  expiry,
  className,
  iccid,
  onExpired,
}: ExpiryCountdownProps) {
  const [now, setNow] = useState(Date.now());
  const [time, setTime] = useState<TimeRemaining | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>("safe");
  const [hasNotifiedExpiry, setHasNotifiedExpiry] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const prevExpiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const remaining = getTimeRemaining(expiry);
    setTime(remaining);
    setUrgency(getUrgencyLevel(remaining));

    const isExpired = remaining === null || remaining.totalMs <= 0;
    const wasExpired = prevExpiredRef.current;

    if (isExpired && !wasExpired && !hasNotifiedExpiry) {
      setHasNotifiedExpiry(true);
      
      if (onExpired) {
        onExpired();
      }

      toast({
        title: "Your eSIM has expired",
        description: "Buy a new plan to continue using data",
        variant: "destructive",
      });

      if (iccid) {
        handleSync();
      }
    }

    prevExpiredRef.current = isExpired;
  }, [now, expiry, iccid, hasNotifiedExpiry, onExpired]);

  const handleSync = async () => {
    if (!iccid || isSyncing) return;

    setIsSyncing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await safeFetch(`${apiUrl}/esim/${iccid}/sync`, {
        method: "POST",
        showToast: false,
      });

      if (onExpired) {
        onExpired();
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Failed to refresh eSIM status. Please refresh the page.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (time && time.totalMs <= 0 && iccid && !isSyncing && !hasNotifiedExpiry) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time?.totalMs, iccid, isSyncing, hasNotifiedExpiry]);

  if (!expiry) {
    return (
      <span className={cn("text-[var(--voyage-muted)]", className)}>
        Expiry unknown
      </span>
    );
  }

  if (!time) {
    return (
      <span className={cn("text-[var(--voyage-muted)]", className)}>
        Invalid date
      </span>
    );
  }

  const isExpired = time.totalMs <= 0;
  const displayText = isExpired ? "Expired" : formatRemainingShort(time);
  const fullDate = formatFullExpiryDate(expiry);

  const urgencyClasses: Record<UrgencyLevel, string> = {
    safe: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
    expired: "text-destructive",
  };

  const countdownElement = (
    <span
      className={cn(
        "font-medium transition-colors",
        urgencyClasses[urgency],
        className
      )}
    >
      {displayText}
    </span>
  );

  if (isExpired) {
    return countdownElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {countdownElement}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Expires: {fullDate}</p>
            <p className="text-xs text-[var(--voyage-muted)]">
              {time.days > 0 && `${time.days} day${time.days !== 1 ? "s" : ""}, `}
              {time.hours > 0 && `${time.hours} hour${time.hours !== 1 ? "s" : ""}, `}
              {time.minutes > 0 && `${time.minutes} minute${time.minutes !== 1 ? "s" : ""}, `}
              {time.seconds} second{time.seconds !== 1 ? "s" : ""} remaining
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

