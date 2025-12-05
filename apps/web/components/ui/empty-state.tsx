"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "bg-[var(--voyage-card)] border-[var(--voyage-border)]",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {Icon && (
          <Icon className="h-12 w-12 text-[var(--voyage-muted)] mb-4 opacity-50" />
        )}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-[var(--voyage-muted)] max-w-md mb-6">{description}</p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


