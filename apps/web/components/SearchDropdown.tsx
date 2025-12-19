"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeFetch } from "@/lib/safe-fetch";

interface SearchResult {
  code: string;
  name: string;
  type: number;
  locationLogo?: string;
}

interface SearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: SearchResult) => void;
  className?: string;
  placeholder?: string;
}

export function SearchDropdown({ 
  value, 
  onChange, 
  onSelect,
  onClose,
  className,
  placeholder = "Search countries..."
}: SearchDropdownProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<{ countries: SearchResult[] }>(
          `${apiUrl}/search?q=${encodeURIComponent(value.trim())}`,
          { showToast: false }
        );
        setResults(data?.countries || []);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onChange(result.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSelect) {
      onSelect(result);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--voyage-muted)]" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] rounded-lg pl-10 pr-3 py-2 w-full text-sm text-[var(--voyage-text)] placeholder-[var(--voyage-muted)] focus:ring-2 focus:ring-[var(--voyage-accent)] focus:border-transparent outline-none transition-all"
          placeholder={placeholder}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--voyage-muted)]" />
        )}
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-[var(--voyage-muted)] text-sm">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-[var(--voyage-muted)] text-sm">
              No results found
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={result.code}
                  href={`/countries/${result.code}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 hover:bg-[var(--voyage-bg-light)] transition-colors cursor-pointer",
                    selectedIndex === index && "bg-[var(--voyage-bg-light)]"
                  )}
                >
                  {result.locationLogo ? (
                    <img
                      src={result.locationLogo}
                      alt={result.name}
                      className="w-6 h-4 object-cover rounded"
                    />
                  ) : (
                    <Globe className="h-4 w-4 text-[var(--voyage-muted)]" />
                  )}
                  <span className="text-sm text-white flex-1">{result.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

