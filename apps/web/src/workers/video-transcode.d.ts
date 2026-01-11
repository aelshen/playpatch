/**
 * Video Transcoding Worker
 * SSK-039: Video Transcoding Worker
 *
 * Background worker that transcodes videos to HLS format using FFmpeg
 */
import { Worker } from 'bullmq';
export interface VideoTranscodeJobData {
    videoId: string;
    sourceKey: string;
    familyId: string;
}
/**
 * Create and start the video transcoding worker
 */
export declare function createVideoTranscodeWorker(): Worker<VideoTranscodeJobData, {
    success: boolean;
    videoId: string;
    hlsPath: string;
}, string>;
//# sourceMappingURL=video-transcode.d.ts.map