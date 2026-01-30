/**
 * RealDebrid API Client
 *
 * Provides methods to interact with RealDebrid API for torrent/magnet link downloads
 * Documentation: https://api.real-debrid.com/
 */

import { logger } from '@/lib/logger';

const REALDEBRID_API_BASE = 'https://api.real-debrid.com/rest/1.0';
const API_KEY = process.env.REALDEBRID_API_KEY;

if (!API_KEY && process.env.NODE_ENV !== 'test') {
  logger.warn('REALDEBRID_API_KEY not set - RealDebrid features will be disabled');
}

// ============================================================================
// TypeScript Types
// ============================================================================

export interface RealDebridTorrentFile {
  id: number;
  path: string;
  bytes: number;
  selected: 0 | 1;
}

export interface RealDebridTorrentInfo {
  id: string;
  filename: string;
  hash: string;
  bytes: number;
  host: string;
  split: number;
  progress: number;
  status: 'magnet_error' | 'magnet_conversion' | 'waiting_files_selection' | 'queued' | 'downloading' | 'downloaded' | 'error' | 'virus' | 'compressing' | 'uploading' | 'dead';
  added: string;
  links: string[];
  ended?: string;
  speed?: number;
  seeders?: number;
  files?: RealDebridTorrentFile[];
}

export interface RealDebridUnrestrictedLink {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  crc: number;
  download: string;
  streamable: 0 | 1;
}

export interface RealDebridInstantAvailability {
  [hash: string]: {
    rd?: Array<{
      [fileId: string]: {
        filename: string;
        filesize: number;
      };
    }>;
  };
}

export interface MagnetMetadata {
  hash: string;
  name: string;
  files: Array<{
    id: number;
    name: string;
    size: number;
  }>;
  totalSize: number;
}

// ============================================================================
// Error Handling
// ============================================================================

export class RealDebridError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'RealDebridError';
  }
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_KEY) {
    throw new RealDebridError('RealDebrid API key not configured');
  }

  const url = `${REALDEBRID_API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle rate limiting
    if (response.status === 429) {
      throw new RealDebridError('Rate limit exceeded. Please try again later.', 429);
    }

    // Parse response
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      throw new RealDebridError(errorMessage, response.status, data.error_code);
    }

    return data as T;
  } catch (error) {
    if (error instanceof RealDebridError) {
      throw error;
    }

    logger.error({ error, endpoint }, 'RealDebrid API request failed');
    throw new RealDebridError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract hash from magnet link
 */
export function extractMagnetHash(magnetUri: string): string | null {
  try {
    const match = magnetUri.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Extract name from magnet link
 */
export function extractMagnetName(magnetUri: string): string | null {
  try {
    const match = magnetUri.match(/dn=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Validate magnet URI format
 */
export function isMagnetUri(uri: string): boolean {
  return uri.startsWith('magnet:?xt=urn:btih:');
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Check if torrents are instantly available (cached)
 * Note: RealDebrid removed this endpoint - we now try adding and checking the response
 */
export async function checkInstantAvailability(
  hashes: string[]
): Promise<RealDebridInstantAvailability> {
  logger.warn('RealDebrid instant availability endpoint was removed - using fallback method');

  // Return empty result - caller should try adding torrent instead
  return {};
}

/**
 * Add a magnet link to RealDebrid
 */
export async function addMagnet(magnetUri: string): Promise<{ id: string; uri: string }> {
  if (!isMagnetUri(magnetUri)) {
    throw new RealDebridError('Invalid magnet URI format');
  }

  logger.info({ magnetUri: magnetUri.substring(0, 50) }, 'Adding magnet to RealDebrid');

  const formData = new URLSearchParams();
  formData.append('magnet', magnetUri);

  const result = await makeRequest<{ id: string; uri: string }>('/torrents/addMagnet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  logger.info({ torrentId: result.id }, 'Magnet added successfully');
  return result;
}

/**
 * Get torrent information including file list
 */
export async function getTorrentInfo(torrentId: string): Promise<RealDebridTorrentInfo> {
  logger.info({ torrentId }, 'Fetching torrent info');
  return makeRequest<RealDebridTorrentInfo>(`/torrents/info/${torrentId}`);
}

/**
 * Select files to download from a torrent
 * @param torrentId - The torrent ID
 * @param fileIds - Array of file IDs to select, or 'all' to select all files
 */
export async function selectFiles(
  torrentId: string,
  fileIds: number[] | 'all'
): Promise<void> {
  const files = fileIds === 'all' ? 'all' : fileIds.join(',');

  logger.info({ torrentId, files }, 'Selecting torrent files');

  const formData = new URLSearchParams();
  formData.append('files', files);

  await makeRequest<void>(`/torrents/selectFiles/${torrentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  logger.info({ torrentId }, 'Files selected successfully');
}

/**
 * Get unrestricted download link from a RealDebrid link
 */
export async function unrestrictLink(link: string): Promise<RealDebridUnrestrictedLink> {
  logger.info({ link: link.substring(0, 50) }, 'Unrestricting link');

  const formData = new URLSearchParams();
  formData.append('link', link);

  return makeRequest<RealDebridUnrestrictedLink>('/unrestrict/link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
}

/**
 * Delete a torrent from RealDebrid
 */
export async function deleteTorrent(torrentId: string): Promise<void> {
  logger.info({ torrentId }, 'Deleting torrent');
  await makeRequest<void>(`/torrents/delete/${torrentId}`, {
    method: 'DELETE',
  });
}

/**
 * Get list of user's torrents
 */
export async function listTorrents(options?: {
  offset?: number;
  limit?: number;
  filter?: 'active' | 'ended';
}): Promise<RealDebridTorrentInfo[]> {
  const params = new URLSearchParams();
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.filter) params.append('filter', options.filter);

  const query = params.toString() ? `?${params.toString()}` : '';
  return makeRequest<RealDebridTorrentInfo[]>(`/torrents${query}`);
}

// ============================================================================
// High-Level Helper Functions
// ============================================================================

/**
 * Extract metadata from a magnet link by adding it to RealDebrid
 * and retrieving file information
 */
export async function getMagnetMetadata(magnetUri: string): Promise<MagnetMetadata> {
  // Extract hash and name from magnet URI
  const hash = extractMagnetHash(magnetUri);
  const name = extractMagnetName(magnetUri);

  if (!hash) {
    throw new RealDebridError('Could not extract hash from magnet URI');
  }

  logger.info({ hash, name }, 'Extracting magnet metadata');

  // Add magnet to RealDebrid
  const { id } = await addMagnet(magnetUri);

  // Wait a bit for RealDebrid to process the magnet
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get torrent info with file list
  const torrentInfo = await getTorrentInfo(id);

  // Check if we need to wait for file list
  if (torrentInfo.status === 'magnet_conversion') {
    logger.info({ torrentId: id }, 'Waiting for magnet conversion...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const updatedInfo = await getTorrentInfo(id);

    if (!updatedInfo.files || updatedInfo.files.length === 0) {
      throw new RealDebridError('Failed to retrieve file list from torrent');
    }

    return {
      hash: updatedInfo.hash,
      name: updatedInfo.filename || name || 'Unknown',
      files: updatedInfo.files.map(f => ({
        id: f.id,
        name: f.path,
        size: f.bytes,
      })),
      totalSize: updatedInfo.bytes,
    };
  }

  if (!torrentInfo.files || torrentInfo.files.length === 0) {
    throw new RealDebridError('No files found in torrent');
  }

  return {
    hash: torrentInfo.hash,
    name: torrentInfo.filename || name || 'Unknown',
    files: torrentInfo.files.map(f => ({
      id: f.id,
      name: f.path,
      size: f.bytes,
    })),
    totalSize: torrentInfo.bytes,
  };
}

/**
 * Wait for a torrent to finish downloading
 */
export async function waitForDownload(
  torrentId: string,
  maxWaitSeconds: number = 300,
  pollIntervalSeconds: number = 5
): Promise<RealDebridTorrentInfo> {
  const maxAttempts = Math.floor(maxWaitSeconds / pollIntervalSeconds);
  let attempts = 0;

  logger.info({ torrentId, maxWaitSeconds }, 'Waiting for torrent download');

  while (attempts < maxAttempts) {
    const info = await getTorrentInfo(torrentId);

    if (info.status === 'downloaded') {
      logger.info({ torrentId }, 'Torrent download completed');
      return info;
    }

    if (info.status === 'error' || info.status === 'virus' || info.status === 'dead') {
      throw new RealDebridError(`Torrent download failed with status: ${info.status}`);
    }

    logger.info(
      { torrentId, status: info.status, progress: info.progress },
      'Torrent download in progress'
    );

    await new Promise(resolve => setTimeout(resolve, pollIntervalSeconds * 1000));
    attempts++;
  }

  throw new RealDebridError('Torrent download timeout');
}

/**
 * Get HTTPS download links for a completed torrent
 */
export async function getDownloadLinks(torrentId: string): Promise<Array<{
  filename: string;
  link: string;
  size: number;
  streamable: boolean;
}>> {
  const info = await getTorrentInfo(torrentId);

  if (info.status !== 'downloaded') {
    throw new RealDebridError(`Torrent not ready for download. Status: ${info.status}`);
  }

  if (!info.links || info.links.length === 0) {
    throw new RealDebridError('No download links available');
  }

  // Unrestrict each link
  const downloadLinks = await Promise.all(
    info.links.map(async (link) => {
      const unrestricted = await unrestrictLink(link);
      return {
        filename: unrestricted.filename,
        link: unrestricted.download,
        size: unrestricted.filesize,
        streamable: unrestricted.streamable === 1,
      };
    })
  );

  logger.info(
    { torrentId, count: downloadLinks.length },
    'Retrieved download links'
  );

  return downloadLinks;
}

/**
 * Complete workflow: Add magnet, select files, wait for download, get links
 */
export async function processMagnet(
  magnetUri: string,
  fileIds: number[] | 'all' = 'all'
): Promise<{
  torrentId: string;
  metadata: MagnetMetadata;
  downloadLinks: Array<{
    filename: string;
    link: string;
    size: number;
    streamable: boolean;
  }>;
}> {
  logger.info({ magnetUri: magnetUri.substring(0, 50) }, 'Processing magnet link');

  // Get metadata
  const metadata = await getMagnetMetadata(magnetUri);
  const { id: torrentId } = await addMagnet(magnetUri);

  // Select files
  await selectFiles(torrentId, fileIds);

  // Wait for download
  await waitForDownload(torrentId);

  // Get download links
  const downloadLinks = await getDownloadLinks(torrentId);

  logger.info({ torrentId }, 'Magnet processing completed');

  return {
    torrentId,
    metadata,
    downloadLinks,
  };
}
