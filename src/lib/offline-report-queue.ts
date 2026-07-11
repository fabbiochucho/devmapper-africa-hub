// IndexedDB-backed offline write queue for report submission - the
// highest-value offline use case for field reporters, who often submit
// from areas with unreliable connectivity. Reports queued while offline
// are stored here and flushed once the browser regains connectivity.

const DB_NAME = 'devmapper-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_reports';

export interface QueuedReport {
  id: number;
  createdAt: string;
  payload: Record<string, unknown>;
  photos: File[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueReport(payload: Record<string, unknown>, photos: File[]): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({ createdAt: new Date().toISOString(), payload, photos });
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function listQueuedReports(): Promise<QueuedReport[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as QueuedReport[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedReport(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Attempts to submit every queued report via the supplied submit function,
 * removing each from the queue on success. Reports that fail (still
 * offline, or a genuine server error) stay queued for the next attempt.
 */
export async function flushQueuedReports(
  submitFn: (payload: Record<string, unknown>, photos: File[]) => Promise<unknown>,
): Promise<{ succeeded: number; failed: number }> {
  const queued = await listQueuedReports();
  let succeeded = 0;
  let failed = 0;
  for (const report of queued) {
    try {
      await submitFn(report.payload, report.photos);
      await removeQueuedReport(report.id);
      succeeded++;
    } catch {
      failed++;
    }
  }
  return { succeeded, failed };
}
