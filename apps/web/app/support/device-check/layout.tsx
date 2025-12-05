import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Device Compatibility Checker - Voyage eSIM",
  description: "Check if your device supports eSIM technology before purchasing. Verify compatibility for iPhone, Samsung, Google Pixel, and other devices.",
  openGraph: {
    title: "Device Compatibility Checker - Voyage eSIM",
    description: "Check if your device supports eSIM technology.",
  },
};

export default function DeviceCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


