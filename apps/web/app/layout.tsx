import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { NavigationUserMenu } from "@/components/NavigationUserMenu";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { CurrencySelector } from "@/components/CurrencySelector";
import { ReferralTracker } from "@/components/ReferralTracker";
import { SignupTracker } from "@/components/SignupTracker";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ErrorToastProvider } from "@/components/ui/error-toast-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voyage eSIM",
  description: "Global eSIM Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <ClerkProvider>
        <CurrencyProvider>
          <ErrorToastProvider>
            <html lang="en">
              <body className={`${inter.className} bg-[var(--voyage-bg)] text-[var(--voyage-text)] min-h-screen antialiased selection:bg-[var(--voyage-accent)] selection:text-white`}>
                <div className="fixed inset-0 bg-gradient-to-br from-[var(--voyage-bg)] via-[var(--voyage-bg)] to-[#051020] -z-10" />
                
                <nav className="sticky top-0 z-50 bg-[var(--voyage-bg)]/80 backdrop-blur-md border-b border-[var(--voyage-border)]">
                   <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                     <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--voyage-accent)]">
                       Voyage
                     </Link>
                     <div className="flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="hover:text-[var(--voyage-accent)] transition-colors">Store</Link>
                        
                        <SignedOut>
                          <Link href="/support" className="hover:text-[var(--voyage-accent)] transition-colors">Support</Link>
                          <div className="flex items-center gap-3">
                            <Link href="/sign-in" className="hover:text-[var(--voyage-accent)] transition-colors">
                              Sign In
                            </Link>
                            <Link 
                              href="/sign-up" 
                              className="px-4 py-2 rounded-lg bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white transition-colors"
                            >
                              Sign Up
                            </Link>
                          </div>
                        </SignedOut>
                        
                        <CurrencySelector />
                        
                        <SignedIn>
                          <NavigationUserMenu />
                        </SignedIn>
                     </div>
                   </div>
                </nav>
                
                <div className="max-w-6xl mx-auto px-6 py-10">
                   <ReferralTracker />
                   <SignedIn>
                     <SignupTracker />
                   </SignedIn>
                   {children}
                </div>
                <Toaster />
              </body>
            </html>
          </ErrorToastProvider>
        </CurrencyProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
