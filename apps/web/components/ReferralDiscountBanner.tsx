"use client";

import { useState, useEffect } from "react";
import { getStoredReferralCode } from "@/lib/referral";
import { Gift, X } from "lucide-react";

/**
 * Banner component that shows when the user has a referral code stored
 * Displays the "10% off your first purchase" benefit
 */
export function ReferralDiscountBanner() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has a referral code stored
    const code = getStoredReferralCode();
    setReferralCode(code);

    // Check if banner was dismissed in this session
    const wasDismissed = sessionStorage.getItem("referral_banner_dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("referral_banner_dismissed", "true");
  };

  // Don't show if no referral code or banner was dismissed
  if (!referralCode || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 rounded-full p-1.5">
            <Gift className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-sm text-green-100">
            <span className="font-semibold">You've been referred!</span>
            <span className="hidden sm:inline"> — Get </span>
            <span className="sm:hidden"> </span>
            <span className="font-bold text-green-300">10% off</span>
            <span className="hidden sm:inline"> your first eSIM purchase</span>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-green-400 hover:text-green-300 transition-colors p-1"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

