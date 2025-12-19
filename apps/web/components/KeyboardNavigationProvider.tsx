"use client";

import { useCommonKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";

export function KeyboardNavigationProvider({ children }: { children: React.ReactNode }) {
  useCommonKeyboardShortcuts();
  return <>{children}</>;
}


