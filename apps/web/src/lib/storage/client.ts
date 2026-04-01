/**
 * Storage Client
 * Supports both local filesystem and MinIO/S3 storage
 */

import { StorageBackend, BUCKETS } from './interface';
import { LocalStorageBackend } from './local';

// Determine which storage backend to use based on environment
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local' or 'minio'

// Initialize the storage backend
let storageBackend: StorageBackend;
let storageInitialized = false;

if (STORAGE_TYPE === 'local') {
  storageBackend = new LocalStorageBackend();
} else {
  // MinIO backend - dynamically import to avoid errors when not using it
  throw new Error('MinIO backend not yet migrated - use STORAGE_TYPE=local');
}

// Auto-initialize storage on first use
async function ensureInitialized() {
  if (!storageInitialized) {
    await storageBackend.initialize();
    storageInitialized = true;
  }
}

export { BUCKETS };

/**
 * Initialize storage - creates buckets/directories if they don't exist
 */
export async function initializeStorage() {
  await storageBackend.initialize();
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  bucket: string,
  objectName: string,
  filePath: string,
  metadata?: Record<string, string>
): Promise<void> {
  await ensureInitialized();
  await storageBackend.uploadFile(bucket, objectName, filePath, metadata);
}

/**
 * Upload from buffer
 */
export async function uploadBuffer(
  bucket: string,
  objectName: string,
  buffer: Buffer,
  metadata?: Record<string, string>
): Promise<void> {
  await ensureInitialized();
  await storageBackend.uploadBuffer(bucket, objectName, buffer, metadata);
}

/**
 * Download a file
 */
export async function downloadFile(bucket: string, objectName: string): Promise<Buffer> {
  return await storageBackend.downloadFile(bucket, objectName);
}

/**
 * Get file URL (presigned for cloud storage, API path for local)
 */
export async function getFileUrl(
  bucket: string,
  objectName: string,
  expiry: number = 3600 // 1 hour default
): Promise<string> {
  return await storageBackend.getFileUrl(bucket, objectName, expiry);
}

/**
 * Delete a file
 */
export async function deleteFile(bucket: string, objectName: string): Promise<void> {
  await storageBackend.deleteFile(bucket, objectName);
}

/**
 * List files in bucket
 */
export async function listFiles(bucket: string, prefix?: string): Promise<string[]> {
  return await storageBackend.listFiles(bucket, prefix);
}

/**
 * Check if file exists
 */
export async function fileExists(bucket: string, objectName: string): Promise<boolean> {
  return await storageBackend.fileExists(bucket, objectName);
}

/**
 * Get the storage backend instance (for advanced usage)
 */
export function getStorageBackend(): StorageBackend {
  return storageBackend;
}

// Export for backwards compatibility
export { storageBackend as default };
