"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search countries...", className }: SearchBarProps) {
  return (
    <div className={cn("relative w-full max-w-lg group", className)}>
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--voyage-muted)] group-focus-within:text-[var(--voyage-accent)] transition-colors" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-full pl-12 pr-6 py-4 w-full text-[var(--voyage-text)] placeholder-[var(--voyage-muted)] focus:ring-2 focus:ring-[var(--voyage-accent)] focus:border-transparent outline-none transition-all shadow-lg focus:shadow-[var(--voyage-accent)]/20"
        placeholder={placeholder}
      />
    </div>
  );
}
