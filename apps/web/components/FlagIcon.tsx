"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FlagIconProps {
  logoUrl?: string;
  alt: string;
  className?: string;
}

export function FlagIcon({ logoUrl, alt, className }: FlagIconProps) {
  const [imageError, setImageError] = useState(false);
  const countryCode = alt.substring(0, 2).toUpperCase();

  // If no logoUrl or image failed to load, show initials
  if (!logoUrl || imageError) {
    return (
      <div className={cn("relative h-8 w-8 overflow-hidden rounded-full border bg-gray-100 flex items-center justify-center", className)}>
        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-500">
          {countryCode}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-8 w-8 overflow-hidden border bg-gray-100", className)}>
      <Image
        src={logoUrl}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized // External images may need this
      />
    </div>
  );
}

