import { cn, formatCurrency } from "@/lib/utils";

interface PriceTagProps {
  price: number; // Price amount (e.g. 0.25, 10.50)
  className?: string;
  currencyCode?: string;
}

export function PriceTag({ price, className, currencyCode = "USD" }: PriceTagProps) {
  const formattedPrice = formatCurrency(price, currencyCode);

  return (
    <span className={cn("font-bold text-blue-600", className)}>
      {formattedPrice}
    </span>
  );
}

