import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number; // in 1/10000 currency units (e.g. 10000 = $1.00)
  className?: string;
  currencyCode?: string;
}

export function PriceTag({ price, className, currencyCode = "USD" }: PriceTagProps) {
  // 10000 -> 1.00
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(price / 10000);

  return (
    <span className={cn("font-bold text-blue-600", className)}>
      {formattedPrice}
    </span>
  );
}

