import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Center - Voyage eSIM",
  description: "Get help with eSIM installation, troubleshooting, device compatibility, refund policy, and contact support. Comprehensive guides for iPhone and Android devices.",
  openGraph: {
    title: "Support Center - Voyage eSIM",
    description: "Get help with eSIM installation, troubleshooting, and device compatibility.",
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


