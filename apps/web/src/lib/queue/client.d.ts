/**
 * BullMQ Queue Client
 * SSK-008: Background Job Queue Setup
 */
import { Queue } from 'bullmq';
export declare const QUEUE_NAMES: {
    readonly VIDEO_DOWNLOAD: "video-download";
    readonly VIDEO_TRANSCODE: "video-transcode";
    readonly VIDEO_TRANSCRIBE: "video-transcribe";
    readonly THUMBNAIL_GENERATE: "thumbnail-generate";
    readonly CHANNEL_SYNC: "channel-sync";
    readonly CLEANUP: "cleanup";
    readonly REPORT_GENERATION: "report-generation";
};
export declare const videoDownloadQueue: Queue<any, any, string, any, any, string>;
export declare const videoTranscodeQueue: Queue<any, any, string, any, any, string>;
export declare const videoTranscribeQueue: Queue<any, any, string, any, any, string>;
export declare const thumbnailGenerateQueue: Queue<any, any, string, any, any, string>;
export declare const channelSyncQueue: Queue<any, any, string, any, any, string>;
export declare const cleanupQueue: Queue<any, any, string, any, any, string>;
export declare const reportGenerationQueue: Queue<any, any, string, any, any, string>;
/**
 * Add video download job
 */
export declare function addVideoDownloadJob(data: {
    videoId: string;
    sourceUrl: string;
    sourceType: string;
}): Promise<import("bullmq").Job<any, any, string>>;
/**
 * Add video transcode job
 */
export declare function addVideoTranscodeJob(data: {
    videoId: string;
    localPath: string;
}): Promise<import("bullmq").Job<any, any, string>>;
/**
 * Add video transcribe job
 */
export declare function addVideoTranscribeJob(data: {
    videoId: string;
    localPath: string;
}): Promise<import("bullmq").Job<any, any, string>>;
/**
 * Add thumbnail generation job
 */
export declare function addThumbnailGenerateJob(data: {
    videoId: string;
    localPath: string;
}): Promise<import("bullmq").Job<any, any, string>>;
/**
 * Add video import job (for channel sync)
 */
export declare function addVideoImportJob(data: {
    videoId: string;
    familyId: string;
    sourceUrl: string;
    sourceType: string;
    channelId?: string;
    metadata?: {
        title?: string;
        duration?: number;
        thumbnailUrl?: string;
        uploadDate?: string;
        viewCount?: number;
    };
}): Promise<import("bullmq").Job<any, any, string>>;
/**
 * Add channel sync job
 */
export declare function addChannelSyncJob(data: {
    channelId: string;
}): Promise<import("bullmq").Job<any, any, string>>;
/**
 * Get queue stats
 */
export declare function getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}>;
/**
 * Get all queue stats
 */
export declare function getAllQueueStats(): Promise<Record<string, any>>;
export declare const queues: {
    videoDownload: Queue<any, any, string, any, any, string>;
    videoTranscode: Queue<any, any, string, any, any, string>;
    videoTranscribe: Queue<any, any, string, any, any, string>;
    thumbnailGenerate: Queue<any, any, string, any, any, string>;
    channelSync: Queue<any, any, string, any, any, string>;
    cleanup: Queue<any, any, string, any, any, string>;
    reportGeneration: Queue<any, any, string, any, any, string>;
};
export default queues;
//# sourceMappingURL=client.d.ts.map