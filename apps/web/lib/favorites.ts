/**
 * Favorites/Wishlist utility functions
 * Uses localStorage to persist favorite plans
 */

import { Plan } from "@/components/PlanCard";

const FAVORITES_KEY = "voyage_favorites";

export function getFavorites(): Plan[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }
}

export function addToFavorites(plan: Plan): void {
  if (typeof window === "undefined") return;
  
  try {
    const favorites = getFavorites();
    // Check if already favorited
    if (favorites.some(p => p.packageCode === plan.packageCode)) {
      return;
    }
    favorites.push(plan);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Failed to save favorite:", error);
  }
}

export function removeFromFavorites(packageCode: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(p => p.packageCode !== packageCode);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove favorite:", error);
  }
}

export function isFavorite(packageCode: string): boolean {
  if (typeof window === "undefined") return false;
  
  const favorites = getFavorites();
  return favorites.some(p => p.packageCode === packageCode);
}

export function clearFavorites(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(FAVORITES_KEY);
  } catch (error) {
    console.error("Failed to clear favorites:", error);
  }
}


