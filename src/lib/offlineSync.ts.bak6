/**
 * Offline Sync System for Driver App
 *
 * Queues failed API requests in localStorage and replays them when connectivity returns.
 * Includes photo compression for offline caching.
 */

const QUEUE_KEY = 'evercold_offline_queue';

export interface PendingAction {
  id: string;
  type: string;
  url: string;
  method: 'POST' | 'PATCH';
  body: string;
  createdAt: string;
  retryCount: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Read the offline queue from localStorage
 */
function readQueue(): PendingAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Write the offline queue to localStorage
 */
function writeQueue(queue: PendingAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Enqueue an action for later replay
 */
export function enqueue(action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>): void {
  const queue = readQueue();
  queue.push({
    ...action,
    id: generateId(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
  writeQueue(queue);
}

/**
 * Process the offline queue (FIFO order)
 * - Remove on 2xx success
 * - Re-enqueue on network error (increment retryCount)
 * - Discard on 4xx client error (unrecoverable)
 */
export async function processQueue(): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: PendingAction[] = [];
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('driverToken') : null;

  for (const action of queue) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: action.body,
      });

      if (response.ok) {
        // Success - remove from queue
        continue;
      }

      if (response.status >= 400 && response.status < 500) {
        // Client error (4xx) - discard, not recoverable
        console.warn(`[OfflineSync] Discarding action ${action.id}: ${response.status}`);
        continue;
      }

      // Server error (5xx) - re-enqueue
      remaining.push({ ...action, retryCount: action.retryCount + 1 });
    } catch {
      // Network error - re-enqueue
      remaining.push({ ...action, retryCount: action.retryCount + 1 });
    }
  }

  writeQueue(remaining);
}

/**
 * Get the number of pending actions in the queue
 */
export function getQueueSize(): number {
  return readQueue().length;
}

/**
 * Fetch wrapper for the driver app that automatically enqueues on failure
 *
 * @param url - API endpoint
 * @param options - Fetch options (method, body, type for queue labeling)
 * @returns Response if online, null if queued for offline
 */
export async function driverFetch(
  url: string,
  options: {
    method: 'POST' | 'PATCH';
    body: Record<string, unknown>;
    type?: string;
  }
): Promise<Response | null> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('driverToken') : null;
  const bodyStr = JSON.stringify(options.body);

  try {
    const response = await fetch(url, {
      method: options.method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: bodyStr,
    });

    return response;
  } catch {
    // Network failure - enqueue for later
    enqueue({
      type: options.type || 'api_call',
      url,
      method: options.method,
      body: bodyStr,
    });
    return null;
  }
}

/**
 * Compress a photo to JPEG at specified quality
 *
 * @param file - Input image file
 * @param quality - JPEG quality (0 to 1), default 0.6
 * @param maxWidth - Maximum image width, default 1280
 * @returns Compressed base64 data URL
 */
export function compressPhoto(
  file: File,
  quality = 0.6,
  maxWidth = 1280
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
