"use client";

const RECENTLY_VIEWED_KEY = "voyage_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  href: string;
  image?: string;
  viewedAt: number;
}

export function addToRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
  if (typeof window === "undefined") return;

  try {
    const existing = getRecentlyViewed();
    
    // Remove if already exists
    const filtered = existing.filter((i) => i.id !== item.id);
    
    // Add to beginning
    const updated = [
      { ...item, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save recently viewed:", error);
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!data) return [];
    
    const items = JSON.parse(data) as RecentlyViewedItem[];
    // Sort by viewedAt (most recent first) and limit
    return items
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_ITEMS);
  } catch (error) {
    console.error("Failed to get recently viewed:", error);
    return [];
  }
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}


