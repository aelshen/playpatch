/**
 * Enhanced Video Download with Better Error Handling and Fallback Strategies
 */
export interface DownloadOptions {
    url: string;
    outputPath: string;
    cookiesPath?: string;
    onProgress?: (progress: number) => void;
}
export interface DownloadResult {
    filePath: string;
    fileSize: number;
    format: string;
}
export declare class DownloadError extends Error {
    userFriendlyMessage: string;
    suggestions: string[];
    retryable: boolean;
    originalError?: any | undefined;
    constructor(message: string, userFriendlyMessage: string, suggestions: string[], retryable: boolean, originalError?: any | undefined);
}
/**
 * Download video with fallback strategies
 */
export declare function downloadVideoWithFallback(options: DownloadOptions): Promise<DownloadResult>;
/**
 * Check if yt-dlp is installed
 */
export declare function checkYtDlpInstalled(): Promise<boolean>;
/**
 * Get yt-dlp version
 */
export declare function getYtDlpVersion(): Promise<string>;
//# sourceMappingURL=video-download-enhanced.d.ts.map