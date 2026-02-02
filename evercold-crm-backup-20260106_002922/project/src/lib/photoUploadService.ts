/**
 * Photo Upload Service
 * Handles uploading delivery checklist photos to cloud storage
 * Uses Cloudflare R2 via presigned URLs or local fallback
 */

import { v4 as uuidv4 } from 'uuid';

export interface PhotoUploadOptions {
  file: File;
  photoType?: 'proof_of_delivery' | 'damage' | 'location' | 'signature';
  checklistId: string;
  caption?: string;
}

export interface UploadedPhoto {
  id: string;
  url: string;
  photoType?: string;
  caption?: string;
  uploadedAt: Date;
}

/**
 * Service for uploading and managing delivery photos
 */
export class PhotoUploadService {
  private static readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly STORAGE_KEY = 'delivery_photos';

  /**
   * Compress image file to reduce size
   * @param file Image file to compress
   * @returns Compressed image as Blob
   */
  static async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob!);
            },
            file.type,
            0.85 // JPEG quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image file
   * @param file File to validate
   * @returns Validation result
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed',
      };
    }

    // Check file size (before compression)
    if (file.size > 10 * 1024 * 1024) {
      // 10MB max before compression
      return {
        valid: false,
        error: 'Image file is too large. Maximum 10MB allowed',
      };
    }

    return { valid: true };
  }

  /**
   * Upload photo to cloud storage
   * Falls back to IndexedDB if cloud upload fails
   * @param options Upload options
   * @returns Upload result with photo URL
   */
  static async uploadPhoto(options: PhotoUploadOptions): Promise<UploadedPhoto> {
    // Validate
    const validation = this.validateImage(options.file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Compress image
    const compressedBlob = await this.compressImage(options.file);

    // Generate unique ID
    const photoId = uuidv4();

    // Try cloud upload first
    try {
      const uploadedUrl = await this.uploadToCloud(
        photoId,
        compressedBlob,
        options.checklistId
      );

      return {
        id: photoId,
        url: uploadedUrl,
        photoType: options.photoType,
        caption: options.caption,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.warn('Cloud upload failed, falling back to IndexedDB:', error);

      // Fallback to IndexedDB
      const localUrl = await this.uploadToLocal(photoId, compressedBlob);

      return {
        id: photoId,
        url: localUrl,
        photoType: options.photoType,
        caption: options.caption,
        uploadedAt: new Date(),
      };
    }
  }

  /**
   * Upload to cloud storage (Cloudflare R2 via presigned URL)
   * @param photoId Photo ID
   * @param blob Image blob
   * @param checklistId Checklist ID for organization
   * @returns Cloud URL
   */
  private static async uploadToCloud(
    photoId: string,
    blob: Blob,
    checklistId: string
  ): Promise<string> {
    // Get presigned URL from backend
    const presignedResponse = await fetch('/api/photos/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        checklistId,
        contentType: blob.type,
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error('Failed to get presigned URL');
    }

    const { presignedUrl } = await presignedResponse.json();

    // Upload to presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to cloud storage');
    }

    // Return the cloud URL
    return `${presignedUrl.split('?')[0]}`; // Remove query params for the public URL
  }

  /**
   * Upload to local IndexedDB storage
   * @param photoId Photo ID
   * @param blob Image blob
   * @returns Local storage URL
   */
  private static async uploadToLocal(photoId: string, blob: Blob): Promise<string> {
    const db = await this.openIndexedDB();
    const tx = db.transaction([this.STORAGE_KEY], 'readwrite');
    const store = tx.objectStore(this.STORAGE_KEY);

    // Store blob with metadata
    await store.add({
      id: photoId,
      blob,
      timestamp: Date.now(),
    });

    // Return local blob URL
    const objectUrl = URL.createObjectURL(blob);
    return objectUrl;
  }

  /**
   * Open or create IndexedDB for photo storage
   */
  private static async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DeliveryPhotoDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORAGE_KEY)) {
          db.createObjectStore(this.STORAGE_KEY, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Sync offline photos when connection restored
   * @param checklistId Checklist to sync
   */
  static async syncOfflinePhotos(checklistId: string): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const tx = db.transaction([this.STORAGE_KEY], 'readonly');
      const store = tx.objectStore(this.STORAGE_KEY);
      const photos = await this.getAllFromStore(store);

      // Try to upload each offline photo
      for (const photo of photos) {
        try {
          await fetch('/api/photos/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: photo.id,
              checklistId,
              blob: photo.blob,
            }),
          });

          // Delete from IndexedDB after successful sync
          const deleteTx = db.transaction([this.STORAGE_KEY], 'readwrite');
          deleteTx.objectStore(this.STORAGE_KEY).delete(photo.id);
        } catch (error) {
          console.warn(`Failed to sync photo ${photo.id}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to sync offline photos:', error);
    }
  }

  /**
   * Get all items from IndexedDB store
   */
  private static getAllFromStore(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete photo from storage
   * @param photoId Photo ID to delete
   */
  static async deletePhoto(photoId: string): Promise<void> {
    try {
      // Try cloud deletion
      await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to delete from cloud:', error);

      // Fallback to local deletion
      try {
        const db = await this.openIndexedDB();
        const tx = db.transaction([this.STORAGE_KEY], 'readwrite');
        tx.objectStore(this.STORAGE_KEY).delete(photoId);
      } catch (e) {
        console.warn('Failed to delete from local storage:', e);
      }
    }
  }
}
