/**
 * Safe fetch wrapper specifically for blob downloads (like PDF receipts)
 */

import { toast } from "@/components/ui/use-toast";
import { AppError } from "./safe-fetch";

/**
 * Wrapper for fetching blobs (PDFs, images, etc.) with error handling
 */
export async function safeFetchBlob(
  url: string,
  options: RequestInit = {}
): Promise<Blob> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const message = `Failed to download: ${response.statusText}`;
      toast({
        variant: "destructive",
        title: "Download Error",
        description: message,
      });
      throw new AppError(message, response.status, `ERR_${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = "Failed to download file. Please try again.";
    toast({
      variant: "destructive",
      title: "Download Error",
      description: message,
    });
    throw new AppError(message, 0, "DOWNLOAD_ERROR", error);
  }
}


