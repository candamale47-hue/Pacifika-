const STORAGE_KEY = "pw_recently_viewed";
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  category: string;
  viewedAt: number;
}

export function addRecentlyViewed(product: Omit<RecentlyViewedItem, "viewedAt">) {
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((item) => item.id !== product.id);
    const updated = [
      { ...product, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be full
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  localStorage.removeItem(STORAGE_KEY);
}
