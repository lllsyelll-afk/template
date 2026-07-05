const DB_NAME = "appDB";
const DB_VERSION = 1;
const STORE_NAME = "app_db";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "placeId" });
        store.createIndex("viewedAt", "viewedAt", { unique: false });
      }
    };
  });
}
