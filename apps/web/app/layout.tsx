import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { AdminNavLink } from "@/components/AdminNavLink";

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
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-[var(--voyage-bg)] text-[var(--voyage-text)] min-h-screen antialiased selection:bg-[var(--voyage-accent)] selection:text-white`}>
          <div className="fixed inset-0 bg-gradient-to-br from-[var(--voyage-bg)] via-[var(--voyage-bg)] to-[#051020] -z-10" />
          
          <nav className="sticky top-0 z-50 bg-[var(--voyage-bg)]/80 backdrop-blur-md border-b border-[var(--voyage-border)]">
             <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
               <Link href="/countries" className="text-2xl font-bold tracking-tight text-[var(--voyage-accent)]">
                 Voyage
               </Link>
               <div className="flex items-center gap-6 text-sm font-medium">
                  <Link href="/countries" className="hover:text-[var(--voyage-accent)] transition-colors">Store</Link>
                  <SignedIn>
                    <Link href="/my-esims" className="hover:text-[var(--voyage-accent)] transition-colors">My eSIMs</Link>
                    <AdminNavLink />
                  </SignedIn>
                  
                  <SignedOut>
                    <div className="flex items-center gap-3">
                      <SignInButton mode="modal">
                        <button className="hover:text-[var(--voyage-accent)] transition-colors">Sign In</button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="px-4 py-2 rounded-lg bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white transition-colors">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </div>
                  </SignedOut>
                  
                  <SignedIn>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                        },
                      }}
                    />
                  </SignedIn>
               </div>
             </div>
          </nav>
          
          <div className="max-w-6xl mx-auto px-6 py-10">
             {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
