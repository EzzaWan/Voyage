"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || generateBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) return null; // Don't show breadcrumbs if only home

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={item.href || item.label} className="flex items-center gap-2">
              {index === 0 ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    isLast
                      ? "text-[var(--voyo-text)]"
                      : "text-[var(--voyo-muted)] hover:text-white"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Link>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 text-[var(--voyo-muted)]" />
                  {isLast ? (
                    <span className="text-[var(--voyo-text)] font-medium">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-[var(--voyo-muted)] hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  // Skip home page
  if (pathname === "/") return crumbs;

  const segments = pathname.split("/").filter(Boolean);

  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    let label = segment;

    // Format labels
    label = label
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Special cases
    if (segment === "my-esims") label = "My eSIMs";
    if (segment === "account") label = "Account";
    if (segment === "checkout") label = "Checkout";
    if (segment === "support") label = "Support";
    if (segment === "admin") label = "Admin";
    if (segment === "plans") label = "Plans";
    if (segment === "countries") label = "Countries";
    if (segment === "regions") label = "Regions";
    if (segment === "affiliate") label = "Affiliate";
    if (segment === "vcash") label = "V-Cash";
    if (segment === "topup") label = "Top-up";
    if (segment === "orders") label = "Orders";

    // For dynamic routes, try to get a better label
    if (segment.match(/^[a-f0-9-]{36}$/i)) {
      // UUID - could be order ID, eSIM ID, etc.
      const parent = segments[index - 1];
      if (parent === "orders") label = "Order Details";
      if (parent === "esims" || parent === "my-esims") label = "eSIM Details";
      if (parent === "users") label = "User Details";
      if (parent === "support") label = "Ticket Details";
    }

    crumbs.push({ label, href });
  });

  return crumbs;
}


