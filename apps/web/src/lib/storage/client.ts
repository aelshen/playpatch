/**
 * MinIO / S3 Storage Client
 * SSK-005: MinIO/S3 Integration
 */

import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio_password',
});

export const BUCKETS = {
  VIDEOS: process.env.MINIO_BUCKET_VIDEOS || 'videos',
  THUMBNAILS: process.env.MINIO_BUCKET_THUMBNAILS || 'thumbnails',
  AVATARS: process.env.MINIO_BUCKET_AVATARS || 'avatars',
  JOURNALS: 'journals',
} as const;

/**
 * Initialize buckets - creates them if they don't exist
 */
export async function initializeBuckets() {
  for (const bucket of Object.values(BUCKETS)) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket, 'us-east-1');
      console.log(`Created bucket: ${bucket}`);
    }
  }
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
  await minioClient.fPutObject(bucket, objectName, filePath, metadata);
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
  await minioClient.putObject(bucket, objectName, buffer, buffer.length, metadata);
}

/**
 * Download a file
 */
export async function downloadFile(bucket: string, objectName: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const stream = await minioClient.getObject(bucket, objectName);

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Generate presigned URL for temporary access
 */
export async function getPresignedUrl(
  bucket: string,
  objectName: string,
  expiry: number = 3600 // 1 hour default
): Promise<string> {
  return await minioClient.presignedGetObject(bucket, objectName, expiry);
}

/**
 * Delete a file
 */
export async function deleteFile(bucket: string, objectName: string): Promise<void> {
  await minioClient.removeObject(bucket, objectName);
}

/**
 * List files in bucket
 */
export async function listFiles(bucket: string, prefix?: string): Promise<string[]> {
  const files: string[] = [];
  const stream = minioClient.listObjects(bucket, prefix, true);

  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => files.push(obj.name));
    stream.on('end', () => resolve(files));
    stream.on('error', reject);
  });
}

/**
 * Check if file exists
 */
export async function fileExists(bucket: string, objectName: string): Promise<boolean> {
  try {
    await minioClient.statObject(bucket, objectName);
    return true;
  } catch {
    return false;
  }
}

export { minioClient };
export default minioClient;
