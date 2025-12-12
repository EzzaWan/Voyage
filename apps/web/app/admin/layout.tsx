"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
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
  Percent,
  ChevronDown,
  ChevronRight,
  Store
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Store": true,
    "Affiliates": true,
    "System": true,
    "Users": true
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

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

  const navStructure = [
    {
      type: "link",
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      type: "group",
      label: "Store",
      icon: Store,
      children: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { href: "/admin/esims", label: "eSIM Profiles", icon: Smartphone },
        { href: "/admin/topups", label: "Top-ups", icon: CreditCard },
      ]
    },
    {
      type: "group",
      label: "Users & Cash",
      icon: Users,
      children: [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/vcash", label: "V-Cash", icon: Wallet },
      ]
    },
    {
      type: "group",
      label: "Affiliates",
      icon: Shield,
      children: [
        { href: "/admin/affiliates", label: "Overview", icon: Users },
        { href: "/admin/affiliate/payouts", label: "Payouts", icon: CreditCard },
        { href: "/admin/affiliate/fraud", label: "Fraud", icon: Shield },
      ]
    },
    {
      type: "group",
      label: "System",
      icon: Settings,
      children: [
        { href: "/admin/discounts", label: "Discounts", icon: Percent },
        { href: "/admin/support", label: "Support Tickets", icon: MessageSquare },
        { href: "/admin/settings", label: "Settings", icon: Settings },
        { href: "/admin/emails", label: "Email Logs", icon: Mail },
        { href: "/admin/logs", label: "Logs", icon: FileText },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--voyage-card)] border-r border-[var(--voyage-border)] fixed left-0 top-0 bottom-0 overflow-y-auto z-50">
        <div className="p-6 border-b border-[var(--voyage-border)] sticky top-0 bg-[var(--voyage-card)] z-10">
          <Link
            href="/admin"
            className="text-xl font-bold text-[var(--voyage-accent)]"
          >
            Admin Panel
          </Link>
        </div>
        <nav className="p-4 space-y-1 pb-24">
          {navStructure.map((item, index) => {
            if (item.type === "link" && item.href) {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors mb-1 ${
                    isActive 
                      ? "bg-[var(--voyage-accent)] text-white" 
                      : "text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)] hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            } else if (item.type === "group" && item.children) {
              const Icon = item.icon;
              const isExpanded = expandedGroups[item.label];
              const isActiveGroup = item.children.some(child => pathname === child.href);
              
              return (
                <div key={item.label} className="mb-2">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                      isActiveGroup && !isExpanded
                        ? "text-[var(--voyage-accent)] bg-[var(--voyage-bg-light)]"
                        : "text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4 pl-4 border-l border-[var(--voyage-border)] mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                              isChildActive
                                ? "bg-[var(--voyage-accent)] text-white"
                                : "text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)] hover:text-white"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--voyage-border)] bg-[var(--voyage-card)]">
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

