"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getStoredReferralCode } from "@/lib/referral";
import { generateDeviceFingerprint } from "@/lib/device-fingerprint";
import { safeFetch } from "@/lib/safe-fetch";

/**
 * Component to track affiliate signup when user first logs in
 * Should be included in authenticated pages
 */
export function SignupTracker() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const trackSignup = async () => {
      try {
        const referralCode = getStoredReferralCode();
        if (!referralCode) return;

        const deviceFingerprint = generateDeviceFingerprint();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

        // Track signup using email (backend will look up user)
        await safeFetch(
          `${apiUrl}/affiliate/track-signup`,
          {
            method: "POST",
            headers: {
              "x-user-email": user.primaryEmailAddress?.emailAddress || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referralCode,
              email: user.primaryEmailAddress?.emailAddress || "",
              deviceFingerprint,
            }),
            showToast: false,
          },
        );
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.debug("Failed to track signup:", error);
      }
    };

    // Track signup once per session
    const hasTracked = sessionStorage.getItem(`signup_tracked_${user.id}`);
    if (!hasTracked) {
      trackSignup();
      sessionStorage.setItem(`signup_tracked_${user.id}`, "true");
    }
  }, [user, isLoaded]);

  return null;
}

