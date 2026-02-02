/**
 * Enhanced Video Download with Better Error Handling and Fallback Strategies
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { logger } from '@/lib/logger';
const execAsync = promisify(exec);
export class DownloadError extends Error {
    userFriendlyMessage;
    suggestions;
    retryable;
    originalError;
    constructor(message, userFriendlyMessage, suggestions, retryable, originalError) {
        super(message);
        this.userFriendlyMessage = userFriendlyMessage;
        this.suggestions = suggestions;
        this.retryable = retryable;
        this.originalError = originalError;
        this.name = 'DownloadError';
    }
}
/**
 * Parse yt-dlp error and convert to user-friendly message
 */
function parseYtDlpError(error) {
    const errorMessage = error.message || error.toString();
    // YouTube 403 Forbidden
    if (errorMessage.includes('HTTP Error 403')) {
        return new DownloadError('YouTube blocked the download request', 'YouTube is blocking downloads from this video', [
            'This video may be age-restricted or region-locked',
            'Try providing YouTube cookies (sign in to YouTube in your browser first)',
            'The video might be available later - YouTube sometimes rate limits downloads',
            'Try a different video or check if the video is publicly accessible'
        ], true, error);
    }
    // Video unavailable
    if (errorMessage.includes('Video unavailable') || errorMessage.includes('This video is not available')) {
        return new DownloadError('Video is not available', 'This video cannot be accessed', [
            'The video might be private or deleted',
            'Check if the YouTube URL is correct',
            'The video might be region-restricted'
        ], false, error);
    }
    // Private video
    if (errorMessage.includes('This video is private')) {
        return new DownloadError('Video is private', 'This video is marked as private by the creator', [
            'Only the video owner can download private videos',
            'Ask the video owner to make it public or unlisted'
        ], false, error);
    }
    // Age-restricted
    if (errorMessage.includes('Sign in to confirm your age')) {
        return new DownloadError('Video is age-restricted', 'This video is age-restricted', [
            'Provide YouTube cookies from a logged-in session',
            'Make sure your YouTube account has confirmed age verification'
        ], true, error);
    }
    // Network/timeout errors
    if (errorMessage.includes('timed out') || errorMessage.includes('Network is unreachable')) {
        return new DownloadError('Network connection failed', 'Could not connect to YouTube', [
            'Check your internet connection',
            'YouTube might be temporarily unavailable',
            'Try again in a few minutes'
        ], true, error);
    }
    // File size
    if (errorMessage.includes('exceeds maximum')) {
        return new DownloadError('File too large', 'This video file is too large', [
            'The video exceeds the 500MB size limit',
            'Try a shorter video or lower quality'
        ], false, error);
    }
    // Generic error
    return new DownloadError(errorMessage, 'Download failed', [
        'Check if the video URL is correct',
        'The video might be temporarily unavailable',
        'Try again later'
    ], true, error);
}
/**
 * Download video with fallback strategies
 */
export async function downloadVideoWithFallback(options) {
    const { url, outputPath, cookiesPath, onProgress } = options;
    // Create download directory
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
    const strategies = [
        {
            name: 'best-quality',
            args: '--format "bestvideo[height<=1080]+bestaudio/best[height<=1080]"',
        },
        {
            name: 'best-single',
            args: '--format "best[height<=1080]"',
        },
        {
            name: 'fallback-quality',
            args: '--format "bestvideo[height<=720]+bestaudio/best[height<=720]"',
        },
    ];
    let lastError = null;
    // Try each strategy
    for (const strategy of strategies) {
        try {
            logger.info({ url, strategy: strategy.name }, `Trying download strategy: ${strategy.name}`);
            const command = [
                'yt-dlp',
                strategy.args,
                '--merge-output-format mp4',
                '--no-playlist',
                cookiesPath ? `--cookies "${cookiesPath}"` : '',
                `--output "${outputPath}"`,
                '--progress',
                '--newline',
                '--no-check-certificate', // Sometimes helps with SSL issues
                '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"',
                `"${url}"`,
            ].filter(Boolean).join(' ');
            const { stdout } = await execAsync(command, {
                maxBuffer: 50 * 1024 * 1024,
            });
            logger.info({ url, strategy: strategy.name }, 'Download successful');
            // Get file size
            const { stdout: statOutput } = await execAsync(`stat -f%z "${outputPath}" 2>/dev/null || stat -c%s "${outputPath}"`);
            const fileSize = parseInt(statOutput.trim());
            return {
                filePath: outputPath,
                fileSize,
                format: 'mp4',
            };
        }
        catch (error) {
            lastError = parseYtDlpError(error);
            logger.warn({
                url,
                strategy: strategy.name,
                error: lastError.userFriendlyMessage
            }, 'Strategy failed, trying next');
            // If error is not retryable, don't try other strategies
            if (!lastError.retryable) {
                break;
            }
        }
    }
    // All strategies failed
    throw lastError || new Error('All download strategies failed');
}
/**
 * Check if yt-dlp is installed
 */
export async function checkYtDlpInstalled() {
    try {
        await execAsync('yt-dlp --version');
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get yt-dlp version
 */
export async function getYtDlpVersion() {
    try {
        const { stdout } = await execAsync('yt-dlp --version');
        return stdout.trim();
    }
    catch {
        return 'unknown';
    }
}
