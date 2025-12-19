"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      shortcuts.forEach((shortcut) => {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey === undefined ? true : e.ctrlKey === shortcut.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined ? true : e.shiftKey === shortcut.shiftKey;
        const altMatch = shortcut.altKey === undefined ? true : e.altKey === shortcut.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Common keyboard shortcuts
export function useCommonKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useKeyboardNavigation([
    {
      key: "k",
      ctrlKey: true,
      action: () => {
        // Focus search bar
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: "Focus search",
    },
    {
      key: "h",
      ctrlKey: true,
      action: () => {
        router.push("/");
      },
      description: "Go to home",
    },
    {
      key: "m",
      ctrlKey: true,
      action: () => {
        router.push("/my-esims");
      },
      description: "Go to My eSIMs",
    },
    {
      key: "a",
      ctrlKey: true,
      action: () => {
        router.push("/account");
      },
      description: "Go to Account",
    },
  ]);
}


