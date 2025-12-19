"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SearchDropdown } from "@/components/SearchDropdown";
import { Menu, X, Globe, LifeBuoy, LogIn, UserPlus, ShoppingBag, User, Smartphone, LogOut } from "lucide-react";
import { CurrencySelector } from "@/components/CurrencySelector";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { NavigationUserMenu } from "@/components/NavigationUserMenu";
import { useRouter } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { isAdmin } = useIsAdmin();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push("/");
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSelect = (result: { code: string; name: string; type: number }) => {
    router.push(`/countries/${result.code}`);
    setSearchValue("");
  };

  const navLinks = [
    { name: "eSIM Plans", href: "/", icon: <ShoppingBag className="h-4 w-4" /> },
    { name: "Support", href: "/support", icon: <LifeBuoy className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[var(--voyage-bg)]/80 backdrop-blur-md border-b border-[var(--voyage-border)]">
      <div className="max-w-6xl mx-auto px-6 h-16">
        {/* Desktop Layout - Grid with 3 equal columns */}
        <div className="hidden md:grid grid-cols-3 items-center h-full">
          {/* Left Section: Logo + Nav Links */}
          <div className="flex items-center gap-8 justify-start">
            <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--voyage-accent)] flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Voyage
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors flex items-center gap-2 ${
                    isActive(link.href)
                      ? "text-[var(--voyage-accent)]"
                      : "text-[var(--voyage-muted)] hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <div className="flex items-center justify-center">
            <div className="w-64">
              <SearchDropdown
                value={searchValue}
                onChange={handleSearch}
                onSelect={handleSearchSelect}
                placeholder="Search countries..."
                className="w-full"
              />
            </div>
          </div>

          {/* Right Section: Currency + User Menu */}
          <div className="flex items-center gap-4 justify-end">
            <div className="h-6 w-px bg-[var(--voyage-border)]" />

            <CurrencySelector />
            
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-[var(--voyage-muted)] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
              >
                <Button size="sm" className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
                  Get Started
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <NavigationUserMenu />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between h-full w-full">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--voyage-accent)] flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Voyage
          </Link>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-4">
            {/* Mobile Search */}
            <div className="flex-1 max-w-xs">
              <SearchDropdown
                value={searchValue}
                onChange={handleSearch}
                onSelect={handleSearchSelect}
                placeholder="Search..."
                className="w-full"
              />
            </div>
            
            <CurrencySelector />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-[var(--voyage-bg-light)]">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[var(--voyage-bg)] border-l border-[var(--voyage-border)] w-[300px]">
              <SheetHeader className="text-left border-b border-[var(--voyage-border)] pb-4 mb-4">
                <SheetTitle className="text-[var(--voyage-accent)] text-xl font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Voyage
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-[var(--voyage-muted)] uppercase tracking-wider mb-2">Menu</h4>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(link.href)
                          ? "bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)]"
                          : "text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)]"
                      }`}
                    >
                      {link.icon}
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-[var(--voyage-border)]" />

                <div className="flex flex-col gap-4">
                  <SignedOut>
                     <h4 className="text-xs font-semibold text-[var(--voyage-muted)] uppercase tracking-wider">Account</h4>
                    <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full justify-start border-[var(--voyage-border)] text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)] hover:text-white">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                      <Button className="w-full justify-start bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </SignedOut>

                  <SignedIn>
                    <h4 className="text-xs font-semibold text-[var(--voyage-muted)] uppercase tracking-wider">Account</h4>
                    <Link 
                      href="/account" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)]"
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">My Account</span>
                    </Link>
                    <Link 
                      href="/my-esims" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)]"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">My eSIMs</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-[var(--voyage-text)] hover:bg-[var(--voyage-bg-light)] w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </SignedIn>
                </div>
              </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

