import Image from "next/image";
import { cn } from "@/lib/utils";

interface FlagIconProps {
  logoUrl?: string;
  alt: string;
  className?: string;
}

export function FlagIcon({ logoUrl, alt, className }: FlagIconProps) {
  return (
    <div className={cn("relative h-8 w-8 overflow-hidden rounded-full border bg-gray-100", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={alt}
          fill
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-500">
          {alt.substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

