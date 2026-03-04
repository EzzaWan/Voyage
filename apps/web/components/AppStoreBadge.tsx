"use client";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL;

// Official-style badge (black, works on dark backgrounds)
const BADGE_SVG_URL =
  "https://upload.wikimedia.org/wikipedia/commons/9/91/Download_on_the_App_Store_RGB_blk.svg";

interface AppStoreBadgeProps {
  className?: string;
  /** Height in pixels. Apple recommends min 40px. */
  height?: number;
}

export function AppStoreBadge({ className = "", height = 44 }: AppStoreBadgeProps) {
  if (!APP_STORE_URL) return null;

  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download Voyo on the App Store"
      className={`inline-block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--voyo-accent)] focus:ring-offset-2 focus:ring-offset-transparent rounded-lg ${className}`}
    >
      <img
        src={BADGE_SVG_URL}
        alt="Download on the App Store"
        height={height}
        width={Math.round(height * (120 / 40))}
        className="object-contain"
        style={{ height: `${height}px`, width: "auto" }}
      />
    </a>
  );
}
