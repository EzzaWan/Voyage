"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/**
 * Global live chat widget using Tawk.to
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_LIVE_CHAT_ENABLED: 'true' to enable, anything else disables
 * - NEXT_PUBLIC_TAWK_PROPERTY_ID: Tawk.to property ID
 * - NEXT_PUBLIC_TAWK_WIDGET_ID: Tawk.to widget ID
 */
export function LiveChat() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Check if live chat is enabled
    const isEnabled = process.env.NEXT_PUBLIC_LIVE_CHAT_ENABLED === "true";
    const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

    if (!isEnabled || !propertyId || !widgetId) {
      return;
    }

    // Prevent duplicate script injection
    // Check if script tag exists OR if Tawk is already loaded
    if (document.getElementById("tawk-script") || (typeof window !== "undefined" && (window as any).Tawk_API && (window as any).Tawk_API.setAttributes)) {
      // Tawk already initialized, skip injection
      return;
    }

    // Initialize Tawk API object if it doesn't exist
    if (typeof window !== "undefined") {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_LoadStart = new Date();
      
      // Prevent auto-opening - minimize widget when it loads (bubble visible, window closed)
      // Users can click the chat bubble to open it manually
      (window as any).Tawk_API.onLoad = function() {
        // Small delay to ensure widget is fully rendered before minimizing
        setTimeout(() => {
          if ((window as any).Tawk_API && typeof (window as any).Tawk_API.minimize === "function") {
            (window as any).Tawk_API.minimize();
          }
        }, 100);
      };
    }

    // Create and inject the Tawk.to script
    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    // Wait for script to load, then set initial attributes
    script.onload = () => {
      // Small delay to ensure Tawk_API is fully initialized
      setTimeout(() => {
        updateTawkAttributes(pathname, user);
      }, 500);
    };

    // Insert script before first existing script tag
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    // Cleanup function (though we typically keep the script loaded)
    return () => {
      // We don't remove the script on unmount to prevent re-injection issues
      // The script should persist across route changes
    };
  }, []); // Empty deps - only run once on mount

  // Update attributes when pathname or user changes
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LIVE_CHAT_ENABLED !== "true") {
      return;
    }

    // Wait for auth to load before updating user attributes
    if (!isLoaded) {
      return;
    }

    updateTawkAttributes(pathname, user);
  }, [pathname, user, isLoaded]);

  return null; // This component doesn't render anything
}

/**
 * Update Tawk.to attributes with current page context and user info
 */
function updateTawkAttributes(pathname: string, user: any) {
  if (typeof window === "undefined") {
    return;
  }

  const Tawk_API = (window as any).Tawk_API;
  if (!Tawk_API || typeof Tawk_API.setAttributes !== "function") {
    // Tawk not ready yet, fail silently
    return;
  }

  try {
    const attributes: Record<string, string> = {
      page: pathname || window.location.pathname,
      url: window.location.href,
    };

    // Add user identification if logged in
    if (user) {
      if (user.id) {
        attributes.userId = user.id;
      }
      if (user.primaryEmailAddress?.emailAddress) {
        attributes.email = user.primaryEmailAddress.emailAddress;
      }
    }

    Tawk_API.setAttributes(attributes, (error: any) => {
      if (error) {
        // Fail silently - don't break the app if Tawk attribute setting fails
        console.warn("Failed to set Tawk attributes:", error);
      }
    });
  } catch (error) {
    // Fail silently - don't break the app if Tawk API is unavailable
    console.warn("Error updating Tawk attributes:", error);
  }
}

