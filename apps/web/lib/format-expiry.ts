export interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type UrgencyLevel = "safe" | "warning" | "danger" | "expired";

export function getTimeRemaining(expiry: string | Date | null | undefined): TimeRemaining | null {
  if (!expiry) return null;

  try {
    const expiryDate = typeof expiry === "string" ? new Date(expiry) : expiry;
    
    if (isNaN(expiryDate.getTime())) {
      return null;
    }

    const now = Date.now();
    const totalMs = expiryDate.getTime() - now;

    if (totalMs <= 0) {
      return {
        totalMs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const seconds = Math.floor((totalMs / 1000) % 60);
    const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
    const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

    return {
      totalMs,
      days,
      hours,
      minutes,
      seconds,
    };
  } catch (error) {
    console.error("Error calculating time remaining:", error);
    return null;
  }
}

export function formatRemainingShort(time: TimeRemaining | null): string {
  if (!time) return "Expiry unknown";
  if (time.totalMs <= 0) return "Expired";

  if (time.days > 0) {
    if (time.hours > 0) {
      return `${time.days}d ${time.hours}h`;
    }
    return `${time.days}d`;
  }

  if (time.hours > 0) {
    if (time.minutes > 0) {
      return `${time.hours}h ${time.minutes}m`;
    }
    return `${time.hours}h`;
  }

  if (time.minutes > 0) {
    return `${time.minutes}m`;
  }

  return `${time.seconds}s`;
}

export function getUrgencyLevel(time: TimeRemaining | null): UrgencyLevel {
  if (!time) return "safe";
  if (time.totalMs <= 0) return "expired";

  const totalHours = time.totalMs / (1000 * 60 * 60);

  if (totalHours > 72) {
    return "safe";
  } else if (totalHours > 24) {
    return "warning";
  } else {
    return "danger";
  }
}

export function formatFullExpiryDate(expiry: string | Date | null | undefined): string {
  if (!expiry) return "Unknown";

  try {
    const expiryDate = typeof expiry === "string" ? new Date(expiry) : expiry;
    
    if (isNaN(expiryDate.getTime())) {
      return "Invalid date";
    }

    return expiryDate.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch (error) {
    return "Invalid date";
  }
}


