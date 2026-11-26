const DB_NAME = 'dreamphysic-private-media';
const STORE_NAME = 'images';
let databasePromise;

function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('Private image storage is unavailable in this browser.'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open private image storage.'));
    });
  }
  return databasePromise;
}

function toPreview(record) {
  return { id: record.id, category: record.category, createdAt: record.createdAt, name: record.name, url: URL.createObjectURL(record.blob) };
}

export async function savePrivateImage(file, category) {
  if (!(file instanceof Blob)) throw new TypeError('Select a valid image file.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new TypeError('Choose a JPEG, PNG, or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new RangeError('Images must be 10 MB or smaller.');
  const db = await openDatabase();
  const record = { id: crypto.randomUUID(), category, createdAt: new Date().toISOString(), name: file.name || 'Private check-in', blob: file };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Could not save this image privately.'));
  });
  return toPreview(record);
}

export async function listPrivateImages(category) {
  const db = await openDatabase();
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).index('category').getAll(category);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not read private images.'));
  });
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPreview);
}
