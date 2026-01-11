/**
 * Video Download Worker
 * SSK-038: Video Download Worker
 *
 * Background worker that downloads videos from YouTube using yt-dlp
 * and uploads them to MinIO/S3 storage
 */
import { Worker } from 'bullmq';
export interface VideoDownloadJobData {
    videoId: string;
    sourceUrl: string;
    sourceType: 'YOUTUBE' | 'VIMEO' | 'OTHER';
    familyId: string;
}
/**
 * Create and start the video download worker
 */
export declare function createVideoDownloadWorker(): Worker<VideoDownloadJobData, {
    success: boolean;
    videoId: string;
    videoKey: string;
}, string>;
//# sourceMappingURL=video-download.d.ts.map