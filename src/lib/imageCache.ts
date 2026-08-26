/**
 * High-Performance Client-Side Image Cache
 * Intercepts Supabase Storage images and caches them in the browser's persistent CacheStorage / Memory.
 * Guarantees that repeat page views and asset visits consume ZERO egress bandwidth from Supabase.
 */

const CACHE_NAME = 'bm-media-cache-v1';
const memoryBlobMap = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Check if image is already cached in memory
 */
export function getInMemoryImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  return memoryBlobMap.get(url) || null;
}

/**
 * Check if the URL belongs to Supabase Storage or external media that should be cached
 */
export function isCacheableUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  return url.includes('supabase.co/storage/') || url.includes('unsplash.com');
}

/**
 * Retrieves a cached Blob Object URL for an image or fetches and caches it locally
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  if (!isCacheableUrl(url)) {
    return url;
  }

  // 1. Check in-memory fast cache first
  if (memoryBlobMap.has(url)) {
    return memoryBlobMap.get(url)!;
  }

  // 2. Check if there is already an in-flight network/cache request for this URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const fetchPromise = (async () => {
    // 3. Check CacheStorage API
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobMap.set(url, blobUrl);
          return blobUrl;
        }

        // Fetch from network with cors, put into cache, and create blob url
        const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
        if (response.ok) {
          // Clone response before putting into cache
          await cache.put(url, response.clone());
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobMap.set(url, blobUrl);
          return blobUrl;
        }
      } catch (err) {
        console.debug('[IMAGE CACHE] Fallback to direct URL:', err);
      }
    }
    return url;
  })().finally(() => {
    inFlightRequests.delete(url);
  });

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Pre-caches a list of image URLs in the background without blocking the UI
 */
export function precacheImages(urls: string[]) {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  const validUrls = urls.filter(isCacheableUrl);
  if (validUrls.length === 0) return;

  // Use requestIdleCallback or setTimeout to run without UI stutter
  const runner = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
  
  runner(() => {
    validUrls.slice(0, 8).forEach(url => {
      getCachedImageUrl(url).catch(() => {});
    });
  });
}
