"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  User,
  Shield,
  LifeBuoy,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { safeFetch } from "@/lib/safe-fetch";

export function NavigationUserMenu() {
  const { isAdmin } = useIsAdmin();
  const { user } = useUser();
  const [esimCount, setEsimCount] = useState<number | null>(null);
  const email = user?.primaryEmailAddress?.emailAddress || "";

  useEffect(() => {
    const fetchEsimCount = async () => {
      if (!email) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<any[]>(
          `${apiUrl}/user/esims?email=${encodeURIComponent(email)}`,
          { showToast: false }
        );
        setEsimCount(data?.length || 0);
      } catch (error) {
        console.error("Failed to fetch eSIM count:", error);
        setEsimCount(0);
      }
    };

    fetchEsimCount();
  }, [email]);

  return (
    <div className="flex items-center gap-2">
      {esimCount !== null && esimCount > 0 && (
        <Badge 
          variant="outline" 
          className="border-[var(--voyo-border)] bg-[var(--voyo-card)] text-[var(--voyo-muted)] text-xs"
        >
          <Smartphone className="h-3 w-3 mr-1" />
          {esimCount} eSIM{esimCount !== 1 ? "s" : ""}
        </Badge>
      )}
      
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
            userButtonPopoverCard: "bg-[var(--voyo-card)] border-[var(--voyo-border)] shadow-lg",
            userButtonPopoverHeader: "bg-[var(--voyo-card)] border-b border-[var(--voyo-border)] !bg-[var(--voyo-card)]",
            userButtonPopoverHeaderTitle: "!text-white text-white",
            userButtonPopoverHeaderSubtitle: "!text-[var(--voyo-muted)] text-[var(--voyo-muted)]",
            userButtonPopoverActions: "bg-[var(--voyo-card)] !bg-[var(--voyo-card)]",
            userButtonPopoverActionButton: "!text-white text-white hover:!bg-[var(--voyo-bg-light)] hover:bg-[var(--voyo-bg-light)] hover:!text-white hover:text-white",
            userButtonPopoverActionButtonText: "!text-white text-white",
            userButtonPopoverActionButtonIcon: "!text-[var(--voyo-muted)] text-[var(--voyo-muted)]",
            userButtonPopoverFooter: "!bg-[var(--voyo-card)] bg-[var(--voyo-card)] border-t border-[var(--voyo-border)] !text-[var(--voyo-muted)] text-[var(--voyo-muted)]",
            userButtonPopoverFooterText: "!text-[var(--voyo-muted)] text-[var(--voyo-muted)]",
            userButtonPopoverActionButton__manageAccount: "!text-white text-white hover:!bg-[var(--voyo-bg-light)] hover:bg-[var(--voyo-bg-light)] hover:!text-white hover:text-white",
          },
          variables: {
            colorBackground: "var(--voyo-card)",
            colorText: "white",
            colorTextSecondary: "var(--voyo-muted)",
            colorInputBackground: "var(--voyo-card)",
            colorInputText: "white",
            colorPrimary: "var(--voyo-accent)",
          },
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Link
            label="Account"
            labelIcon={<User className="h-4 w-4" />}
            href="/account"
          />

          <UserButton.Link
            label="My eSIMs"
            labelIcon={<Smartphone className="h-4 w-4" />}
            href="/my-esims"
          />

          <UserButton.Link
            label="Support"
            labelIcon={<LifeBuoy className="h-4 w-4" />}
            href="/support"
          />

          {isAdmin && (
            <UserButton.Link
              label="Admin"
              labelIcon={<Shield className="h-4 w-4" />}
              href="/admin"
            />
          )}
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}
