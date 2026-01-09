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
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--voyo-muted)] group-focus-within:text-[var(--voyo-accent)] transition-colors" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--voyo-bg-light)] border border-[var(--voyo-border)] rounded-full pl-12 pr-6 py-4 w-full text-[var(--voyo-text)] placeholder-[var(--voyo-muted)] focus:ring-2 focus:ring-[var(--voyo-accent)] focus:border-transparent outline-none transition-all shadow-lg focus:shadow-[var(--voyo-accent)]/20"
        placeholder={placeholder}
      />
    </div>
  );
}
