"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function AdminNavLink() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 hover:text-[var(--voyage-accent)] transition-colors"
    >
      <Shield className="h-4 w-4" />
      <span>Admin</span>
    </Link>
  );
}
