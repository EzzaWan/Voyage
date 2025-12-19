"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Script from "next/script";

export function ClarityTracker() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Exclude admin pages from tracking
  const isAdminPage = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  useEffect(() => {
    // Only identify users after authentication loads and not on admin pages
    if (!isAdminPage && isLoaded && user?.id && typeof window !== "undefined" && (window as any).clarity) {
      (window as any).clarity("identify", user.id);
    }
  }, [pathname, user?.id, isLoaded, isAdminPage]);

  // Conditionally load Clarity script only on non-admin pages
  if (isAdminPage) {
    return null;
  }

  return (
    <Script id="clarity-script" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "unzav99n9a");
      `}
    </Script>
  );
}

