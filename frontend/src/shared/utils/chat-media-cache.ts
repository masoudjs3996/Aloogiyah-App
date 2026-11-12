let database: Promise<IDBDatabase> | undefined;
const fallback = new Map<string, Blob>();
const listeners = new Set<(code: string) => void>();

export function onChatMediaCached(listener: (code: string) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function cacheSentMedia(code: string, type: string, file: File) {
  releaseCachedMedia(await saveCachedMedia(code, type, file));
  for (const listener of listeners) listener(code);
}
function openCache(): Promise<IDBDatabase> {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("aloogiyah-chat-media", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("files");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Media cache unavailable"));
    }).catch((error) => {
      database = undefined;
      throw error;
    });
  return database;
}
export async function readCachedMedia(
  code: string,
  type: string,
  size?: number,
): Promise<string | undefined> {
  let blob = fallback.get(code);
  try {
    const db = await openCache();
    blob = (await new Promise<Blob | undefined>((resolve, reject) => {
      const request = db
        .transaction("files", "readonly")
        .objectStore("files")
        .get(code);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    })) ?? blob;
  } catch {
    /* Private browser modes may disable disk storage. */
  }
  if (!blob || !blob.size || (size && blob.size !== size)) return;
  return URL.createObjectURL(
    blob.type === type ? blob : new Blob([blob], { type }),
  );
}
export async function saveCachedMedia(
  code: string,
  type: string,
  data: Blob | ArrayBuffer,
): Promise<string> {
  const blob = new Blob([data], { type });
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      transaction.objectStore("files").put(blob, code);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    // Keep small downloads reusable when browser disk storage is unavailable.
    if (blob.size <= 5 * 1024 * 1024) {
      if (fallback.size >= 5) fallback.delete(fallback.keys().next().value!);
      fallback.set(code, blob);
    }
  }
  return URL.createObjectURL(blob);
}
export async function removeCachedMedia(code: string): Promise<void> {
  fallback.delete(code);
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      transaction.objectStore("files").delete(code);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    /* Nothing persisted when storage is unavailable. */
  }
}
export function releaseCachedMedia(uri: string) {
  if (uri.startsWith("blob:")) URL.revokeObjectURL(uri);
}
