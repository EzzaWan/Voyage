"use client";

import { UserButton } from "@clerk/nextjs";
import {
  User,
  Shield,
  LifeBuoy,
  Smartphone,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function NavigationUserMenu() {
  const { isAdmin } = useIsAdmin();

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-8 h-8",
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
  );
}
