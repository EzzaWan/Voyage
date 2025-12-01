import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats USD dollars to currency string
 * @param dollars - Price in USD dollars (e.g. 0.25 = $0.25, 3.00 = $3.00)
 * @returns Formatted currency string (e.g. "$0.25", "$3.00")
 */
export function formatUsdDollars(dollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

