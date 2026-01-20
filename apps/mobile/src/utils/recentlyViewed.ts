import * as SecureStore from 'expo-secure-store';

const RECENTLY_VIEWED_KEY = 'voyage_recently_viewed';
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  type: 'country' | 'region' | 'plan';
  code?: string;
  imageUrl?: string;
  viewedAt: number;
}

export async function addToRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): Promise<void> {
  try {
    const existing = await getRecentlyViewed();
    
    // Remove if already exists
    const filtered = existing.filter((i) => i.id !== item.id);
    
    // Add to beginning
    const updated = [
      { ...item, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);

    await SecureStore.setItemAsync(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recently viewed:', error);
  }
}

export async function getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  try {
    const data = await SecureStore.getItemAsync(RECENTLY_VIEWED_KEY);
    if (!data) return [];
    
    const items = JSON.parse(data) as RecentlyViewedItem[];
    // Sort by viewedAt (most recent first) and limit
    return items
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_ITEMS);
  } catch (error) {
    console.error('Failed to get recently viewed:', error);
    return [];
  }
}

export async function clearRecentlyViewed(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.error('Failed to clear recently viewed:', error);
  }
}






