"use client";

import { useEffect } from "react";
import { initReferralTracking } from "@/lib/referral";

/**
 * Component to initialize referral tracking on page load
 * Should be included in the root layout
 */
export function ReferralTracker() {
  useEffect(() => {
    initReferralTracking();
  }, []);

  return null; // This component doesn't render anything
}

