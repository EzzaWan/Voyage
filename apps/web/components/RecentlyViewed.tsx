"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentlyViewed, clearRecentlyViewed, RecentlyViewedItem } from "@/lib/recently-viewed";

interface RecentlyViewedProps {
  maxItems?: number;
  className?: string;
}

export function RecentlyViewed({ maxItems = 5, className }: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const recent = getRecentlyViewed();
    setItems(recent.slice(0, maxItems));
  }, [maxItems]);

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  if (items.length === 0) return null;

  return (
    <Card className={`bg-[var(--voyage-card)] border-[var(--voyage-border)] ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--voyage-accent)]" />
            <CardTitle className="text-white">Recently Viewed</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="bg-transparent text-[var(--voyage-muted)] hover:text-white hover:bg-[var(--voyage-bg-light)] h-8 w-8 p-0 border-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block p-2 rounded-lg hover:bg-[var(--voyage-bg-light)] transition-colors"
            >
              <p className="text-sm text-white font-medium truncate">{item.name}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


