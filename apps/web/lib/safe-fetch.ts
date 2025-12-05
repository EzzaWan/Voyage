/**
 * Safe fetch wrapper that automatically handles errors and shows toast notifications
 */

import { toast } from "@/components/ui/use-toast";

export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

interface SafeFetchOptions extends RequestInit {
  showToast?: boolean;
  errorMessage?: string;
}

/**
 * Wrapper around fetch that automatically handles errors
 * @throws {AppError} - Always throws AppError on failure
 */
export async function safeFetch<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  const { showToast = true, errorMessage, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);

    // Handle non-JSON responses (e.g., 404 HTML pages)
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Try to parse as JSON if it looks like JSON
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || response.statusText || "An error occurred" };
      }
    }

    if (!response.ok) {
      const message =
        errorMessage ||
        data?.message ||
        data?.error ||
        `Request failed: ${response.statusText}`;
      const errorCode = data?.errorCode || data?.code || `ERR_${response.status}`;

      const appError = new AppError(message, response.status, errorCode, data);

      if (showToast) {
        toast({
          variant: "destructive",
          title: "Error",
          description: message,
        });
      }

      throw appError;
    }

    return data as T;
  } catch (error) {
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      const message = errorMessage || "Network error. Please check your connection.";
      const appError = new AppError(message, 0, "NETWORK_ERROR", error);

      if (showToast) {
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: message,
        });
      }

      throw appError;
    }

    // Unknown errors
    const message =
      errorMessage || (error instanceof Error ? error.message : "An unexpected error occurred");
    const appError = new AppError(message, 0, "UNKNOWN_ERROR", error);

    if (showToast) {
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    }

    throw appError;
  }
}

