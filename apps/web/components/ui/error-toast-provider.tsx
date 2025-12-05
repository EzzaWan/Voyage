"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AppError } from "@/lib/safe-fetch";

interface ErrorToastProviderProps {
  children: React.ReactNode;
}

/**
 * Global error handler that catches unhandled errors and shows toast notifications
 */
export function ErrorToastProvider({ children }: ErrorToastProviderProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      let message = "An unexpected error occurred";
      if (event.reason instanceof AppError) {
        message = event.reason.message;
      } else if (event.reason instanceof Error) {
        message = event.reason.message;
      } else if (typeof event.reason === "string") {
        message = event.reason;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);

      const message =
        event.error instanceof AppError
          ? event.error.message
          : event.error?.message || event.message || "An unexpected error occurred";

      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, [toast]);

  return <>{children}</>;
}


