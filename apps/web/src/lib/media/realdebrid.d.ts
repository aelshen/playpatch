/**
 * RealDebrid API Client
 *
 * Provides methods to interact with RealDebrid API for torrent/magnet link downloads
 * Documentation: https://api.real-debrid.com/
 */
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
export declare class RealDebridError extends Error {
    statusCode?: number | undefined;
    errorCode?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, errorCode?: string | undefined);
}
/**
 * Extract hash from magnet link
 */
export declare function extractMagnetHash(magnetUri: string): string | null;
/**
 * Extract name from magnet link
 */
export declare function extractMagnetName(magnetUri: string): string | null;
/**
 * Validate magnet URI format
 */
export declare function isMagnetUri(uri: string): boolean;
/**
 * Format bytes to human-readable size
 */
export declare function formatBytes(bytes: number): string;
/**
 * Check if torrents are instantly available (cached)
 * Note: RealDebrid removed this endpoint - we now try adding and checking the response
 */
export declare function checkInstantAvailability(hashes: string[]): Promise<RealDebridInstantAvailability>;
/**
 * Add a magnet link to RealDebrid
 */
export declare function addMagnet(magnetUri: string): Promise<{
    id: string;
    uri: string;
}>;
/**
 * Get torrent information including file list
 */
export declare function getTorrentInfo(torrentId: string): Promise<RealDebridTorrentInfo>;
/**
 * Select files to download from a torrent
 * @param torrentId - The torrent ID
 * @param fileIds - Array of file IDs to select, or 'all' to select all files
 */
export declare function selectFiles(torrentId: string, fileIds: number[] | 'all'): Promise<void>;
/**
 * Get unrestricted download link from a RealDebrid link
 */
export declare function unrestrictLink(link: string): Promise<RealDebridUnrestrictedLink>;
/**
 * Delete a torrent from RealDebrid
 */
export declare function deleteTorrent(torrentId: string): Promise<void>;
/**
 * Get list of user's torrents
 */
export declare function listTorrents(options?: {
    offset?: number;
    limit?: number;
    filter?: 'active' | 'ended';
}): Promise<RealDebridTorrentInfo[]>;
/**
 * Extract metadata from a magnet link by adding it to RealDebrid
 * and retrieving file information
 */
export declare function getMagnetMetadata(magnetUri: string): Promise<MagnetMetadata>;
/**
 * Wait for a torrent to finish downloading
 */
export declare function waitForDownload(torrentId: string, maxWaitSeconds?: number, pollIntervalSeconds?: number): Promise<RealDebridTorrentInfo>;
/**
 * Get HTTPS download links for a completed torrent
 */
export declare function getDownloadLinks(torrentId: string): Promise<Array<{
    filename: string;
    link: string;
    size: number;
    streamable: boolean;
}>>;
/**
 * Complete workflow: Add magnet, select files, wait for download, get links
 */
export declare function processMagnet(magnetUri: string, fileIds?: number[] | 'all'): Promise<{
    torrentId: string;
    metadata: MagnetMetadata;
    downloadLinks: Array<{
        filename: string;
        link: string;
        size: number;
        streamable: boolean;
    }>;
}>;
//# sourceMappingURL=realdebrid.d.ts.map