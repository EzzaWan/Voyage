import { cn, formatUsdDollars } from "@/lib/utils";

interface PriceTagProps {
  price: number; // in USD dollars (e.g. 0.25 = $0.25, 3.00 = $3.00)
  className?: string;
  currencyCode?: string;
}

export function PriceTag({ price, className, currencyCode = "USD" }: PriceTagProps) {
  const formattedPrice = formatUsdDollars(price);

  return (
    <span className={cn("font-bold text-blue-600", className)}>
      {formattedPrice}
    </span>
  );
}

