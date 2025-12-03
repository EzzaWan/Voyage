"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export function AdminNavLink() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    // Check if user is admin
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();

    if (userEmail && adminEmails.includes(userEmail)) {
      setIsAdmin(true);
    }
    setLoading(false);
  }, [user, isLoaded]);

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

