"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  CreditCard,
  Users,
  Settings,
  FileText,
  ShieldX,
  Shield,
  Mail,
  MessageSquare,
  Wallet,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check if user is admin via API (checks database first, then env vars)
    const checkAdmin = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/admin/check?email=${encodeURIComponent(userEmail)}`);

        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin === true);
        } else {
          // Fallback to env var check if API fails
          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          setIsAdmin(adminEmails.includes(userEmail.toLowerCase()));
        }
      } catch (error) {
        console.error("Admin check error:", error);
        // Fallback to env var check on error
        try {
          const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
          setIsAdmin(userEmail ? adminEmails.includes(userEmail) : false);
        } catch (fallbackError) {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--voyage-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--voyage-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-[var(--voyage-muted)] mb-6">
            You do not have permission to access the admin panel.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

        const navItems = [
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
          { href: "/admin/esims", label: "eSIM Profiles", icon: Smartphone },
          { href: "/admin/topups", label: "Top-ups", icon: CreditCard },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/affiliates", label: "Affiliates", icon: Users },
          { href: "/admin/affiliate/payouts", label: "Affiliate Payouts", icon: CreditCard },
          { href: "/admin/affiliate/fraud", label: "Affiliate Fraud", icon: Shield },
          { href: "/admin/vcash", label: "V-Cash Management", icon: Wallet },
          { href: "/admin/support", label: "Support Tickets", icon: MessageSquare },
          { href: "/admin/settings", label: "Settings", icon: Settings },
          { href: "/admin/emails", label: "Email Logs", icon: Mail },
          { href: "/admin/logs", label: "Logs", icon: FileText },
        ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--voyage-card)] border-r border-[var(--voyage-border)] fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-6 border-b border-[var(--voyage-border)]">
          <Link
            href="/admin"
            className="text-xl font-bold text-[var(--voyage-accent)]"
          >
            Admin Panel
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)] hover:text-white transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--voyage-border)]">
          <Link
            href="/"
            className="block text-center px-4 py-2 rounded-lg text-sm text-[var(--voyage-muted)] hover:text-white hover:bg-[var(--voyage-bg-light)] transition-colors"
          >
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

