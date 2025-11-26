import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        <nav className="p-4 border-b">
           <a href="/" className="mr-4">Store</a>
           <a href="/my-esims" className="mr-4">My eSIMs</a>
           <a href="/profile">Profile</a>
        </nav>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}

