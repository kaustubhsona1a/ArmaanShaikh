import { Vehicle } from '../data/mockData';

const DB_NAME = 'BombayMotorsInventoryCache';
const DB_VERSION = 1;
const STORE_NAME = 'inventory';

interface CacheData {
  key: string;
  value: any;
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[INDEXEDDB LOAD] Error opening IndexedDB database');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CacheData | undefined;
        if (result) {
          console.log(`[CACHE HIT] Key: ${key}`);
          resolve(result.value as T);
        } else {
          console.log(`[CACHE MISS] Key: ${key}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(`[INDEXEDDB LOAD] Error reading key: ${key}`);
        resolve(null);
      };
    });
  } catch (err) {
    console.error('[INDEXEDDB LOAD] Failed to retrieve from IndexedDB', err);
    return null;
  }
}

export async function saveToCache<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({ key, value });

      request.onsuccess = () => {
        console.log(`[INDEXEDDB SAVE] Key: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[INDEXEDDB SAVE] Error writing key: ${key}`);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[INDEXEDDB Save Error]', err);
  }
}

export async function clearCacheStore(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[INDEXEDDB CLEAR] Cache wiped successfully');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB Clear Error]', err);
  }
}
