import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
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
import { LiveChat } from "@/components/LiveChat";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ErrorToastProvider } from "@/components/ui/error-toast-provider";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { KeyboardNavigationProvider } from "@/components/KeyboardNavigationProvider";
import { ClarityTracker } from "@/components/ClarityTracker";

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
      <ClerkProvider
        appearance={{
          baseTheme: "dark",
          elements: {
            userButtonPopoverCard: "bg-[var(--voyage-card)] border-[var(--voyage-border)]",
            userButtonPopoverHeader: "bg-[var(--voyage-card)] border-b border-[var(--voyage-border)]",
            userButtonPopoverHeaderTitle: "text-white",
            userButtonPopoverHeaderSubtitle: "text-[var(--voyage-muted)]",
            userButtonPopoverActions: "bg-[var(--voyage-card)]",
            userButtonPopoverActionButton: "text-white hover:bg-[var(--voyage-bg-light)] hover:text-white",
            userButtonPopoverActionButtonText: "text-white",
            userButtonPopoverActionButtonIcon: "text-[var(--voyage-muted)]",
            userButtonPopoverFooter: "bg-[var(--voyage-card)] border-t border-[var(--voyage-border)]",
          },
        }}
      >
        <CurrencyProvider>
          <ErrorToastProvider>
            <html lang="en">
              <body className={`${inter.className} bg-[var(--voyage-bg)] text-[var(--voyage-text)] min-h-screen antialiased selection:bg-[var(--voyage-accent)] selection:text-white`}>
                {/* Google tag (gtag.js) */}
                <Script
                  src="https://www.googletagmanager.com/gtag/js?id=AW-17806579060"
                  strategy="afterInteractive"
                />
                <Script id="google-ads" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag() {dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'AW-17806579060');
                  `}
                </Script>
                <div className="fixed inset-0 bg-gradient-to-br from-[var(--voyage-bg)] via-[var(--voyage-bg)] to-[#051020] -z-10" />
                
                <KeyboardNavigationProvider>
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    
                    <main className="flex-grow max-w-6xl mx-auto px-6 py-10 w-full">
                       <ReferralTracker />
                       <ClarityTracker />
                       <SignedIn>
                         <SignupTracker />
                       </SignedIn>
                       {children}
                    </main>
                    
                    <Footer />
                  </div>
                </KeyboardNavigationProvider>
                <Toaster />
                <LiveChat />
              </body>
            </html>
          </ErrorToastProvider>
        </CurrencyProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
