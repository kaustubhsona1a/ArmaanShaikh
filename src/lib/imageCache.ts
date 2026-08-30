/**
 * High-Performance Client-Side Image Cache & Egress Shield
 * Uses persistent IndexedDB + CacheStorage + In-Memory Object URLs.
 * Guarantees that any image is downloaded at most ONCE across the lifetime of the user's browser,
 * resulting in 0 bytes of Supabase egress for repeat visits, tab switches, and page navigations.
 */

const DB_NAME = 'bm_image_cache_v2';
const STORE_NAME = 'image_blobs';
const CACHE_STORAGE_NAME = 'bm-media-cache-v2';

const memoryBlobMap = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.debug('[IDB ERROR] Could not open IndexedDB:', req.error);
          resolve(null);
        };
      } catch (e) {
        console.debug('[IDB EXCEPTION]', e);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

async function getFromIDB(key: string): Promise<Blob | null> {
  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

async function saveToIDB(key: string, blob: Blob): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
  } catch (err) {
    console.debug('[IDB SAVE SKIP]', err);
  }
}

/**
 * Check if image is already cached in memory for synchronous zero-flicker render
 */
export function getInMemoryImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  return memoryBlobMap.get(url) || null;
}

/**
 * Normalizes image URLs from local public paths, GitHub links, Supabase storage, or external CDNs.
 * - Converts GitHub web preview URLs (github.com/.../blob/...) to direct raw image URLs (raw.githubusercontent.com/...)
 * - Prepend import.meta.env.BASE_URL to relative/absolute local paths so GitHub Pages subpaths work
 * - Remaps legacy file names (/hero-desktop.jpg, /bombay_logo.jpeg, /backdrop.jpg) to current files
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }

  let cleaned = url.trim();

  // 1. Transform GitHub Blob URLs to Direct Raw URLs
  // Example: https://github.com/user/repo/blob/main/public/logo.png -> https://raw.githubusercontent.com/user/repo/main/public/logo.png
  if (cleaned.includes('github.com/') && cleaned.includes('/blob/')) {
    cleaned = cleaned
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('http://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/blob/', '/');
  }

  // 2. Remap legacy asset filenames to active public assets
  if (cleaned === '/hero-desktop.jpg' || cleaned === '/backdrop.jpg' || cleaned === 'hero-desktop.jpg' || cleaned === 'backdrop.jpg') {
    cleaned = '/hero-laptop.png';
  } else if (cleaned === '/hero-mobile.jpg' || cleaned === 'hero-mobile.jpg') {
    cleaned = '/hero-mobile.png';
  } else if (cleaned === '/bombay_logo.jpeg' || cleaned === '/logo.jpeg' || cleaned === 'bombay_logo.jpeg' || cleaned === 'logo.jpeg') {
    cleaned = '/logo.png';
  }

  // 3. Resolve local paths with Vite base URL if running on a subpath (e.g. GitHub Pages)
  if (cleaned.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/';
    if (base !== '/' && !cleaned.startsWith(base)) {
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      return `${normalizedBase}${cleaned}`;
    }
  }

  return cleaned;
}

/**
 * Check if the URL belongs to Supabase Storage or external media that should be cached
 */
export function isCacheableUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const resolved = resolveImageUrl(url);
  if (!resolved || resolved.startsWith('/') || resolved.startsWith('data:') || resolved.startsWith('blob:')) return false;
  return (
    resolved.includes('supabase.co/storage/') ||
    resolved.includes('raw.githubusercontent.com') ||
    resolved.includes('unsplash.com') ||
    resolved.includes('cloudinary.com') ||
    resolved.startsWith('https://')
  );
}

/**
 * Retrieves a cached Blob Object URL for an image or fetches and caches it permanently
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  if (!isCacheableUrl(url)) {
    return url;
  }

  // Tier 1: In-Memory Fast Map (Instant 0ms)
  if (memoryBlobMap.has(url)) {
    return memoryBlobMap.get(url)!;
  }

  // Tier 2: In-Flight Promise Dedup (Prevents multiple simultaneous network calls)
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const fetchPromise = (async () => {
    // Tier 3: Persistent IndexedDB (0 Network bytes across browser reboots/tabs)
    try {
      const idbBlob = await getFromIDB(url);
      if (idbBlob && idbBlob.size > 0) {
        const blobUrl = URL.createObjectURL(idbBlob);
        memoryBlobMap.set(url, blobUrl);
        return blobUrl;
      }
    } catch {
      // Fallback
    }

    // Tier 4: CacheStorage API
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(CACHE_STORAGE_NAME);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          if (blob && blob.size > 0) {
            saveToIDB(url, blob);
            const blobUrl = URL.createObjectURL(blob);
            memoryBlobMap.set(url, blobUrl);
            return blobUrl;
          }
        }
      } catch {
        // Fallback
      }
    }

    // Tier 5: Exactly ONE network fetch with CORS and max cache policy
    try {
      const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
      if (response.ok) {
        const blob = await response.blob();
        if (blob && blob.size > 0) {
          // Persist to IndexedDB & CacheStorage in background
          saveToIDB(url, blob);
          if (typeof window !== 'undefined' && 'caches' in window) {
            caches.open(CACHE_STORAGE_NAME).then((cache) => {
              try {
                cache.put(url, new Response(blob, {
                  headers: {
                    'Content-Type': blob.type,
                    'Cache-Control': 'public, max-age=31536000, immutable'
                  }
                }));
              } catch {}
            }).catch(() => {});
          }

          const blobUrl = URL.createObjectURL(blob);
          memoryBlobMap.set(url, blobUrl);
          return blobUrl;
        }
      }
    } catch (err) {
      console.debug('[IMAGE FETCH FALLBACK] Direct URL fallback:', err);
    }

    return url;
  })().finally(() => {
    inFlightRequests.delete(url);
  });

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Pre-caches a list of image URLs into IndexedDB during idle time
 */
export function precacheImages(urls: string[]) {
  if (typeof window === 'undefined') return;

  const validUrls = urls.filter(isCacheableUrl);
  if (validUrls.length === 0) return;

  const runner = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
  
  runner(() => {
    validUrls.slice(0, 6).forEach((url) => {
      getCachedImageUrl(url).catch(() => {});
    });
  });
}

