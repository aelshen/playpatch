# Background Workers Setup

## Overview

SSK-038 and SSK-039 implement background workers for video processing:
- **Video Download Worker**: Downloads videos from YouTube using yt-dlp
- **Video Transcoding Worker**: Transcodes videos to HLS format using FFmpeg

## Prerequisites

### 1. yt-dlp
Required for downloading YouTube videos.

```bash
# macOS
brew install yt-dlp

# Linux
pip install yt-dlp

# Verify
yt-dlp --version
```

### 2. FFmpeg
Required for video transcoding and thumbnail generation.

```bash
# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg

# Verify
ffmpeg -version
```

### 3. Redis
Required for BullMQ job queue (should already be running via Docker Compose).

```bash
# Check if Redis is running
docker compose ps
```

### 4. MinIO/S3
Required for video storage (should already be running via Docker Compose).

## Running Workers

### Development Mode

**Start all workers:**
```bash
cd apps/web
pnpm workers
```

**Start individual workers:**
```bash
# Download worker only
pnpm workers:download

# Transcoding worker only
pnpm workers:transcode
```

### Production Mode

Workers should run as separate processes or containers:

```bash
# Using PM2
pm2 start pnpm --name "video-workers" -- workers

# Using Docker
docker compose up -d workers
```

## Worker Architecture

### Video Download Worker (`src/workers/video-download.ts`)

**Responsibilities:**
1. Receives download jobs from the queue
2. Downloads video using yt-dlp
3. Downloads and saves thumbnail
4. Uploads video to MinIO/S3 storage
5. Updates video status in database
6. Queues transcoding job

**Configuration:**
- Concurrency: 2 (processes 2 downloads simultaneously)
- Rate limit: 10 downloads per minute
- Max file size: 500MB
- Download directory: `/tmp/safestream/downloads`

**Job Data:**
```typescript
{
  videoId: string;
  sourceUrl: string;
  sourceType: 'YOUTUBE' | 'VIMEO' | 'OTHER';
  familyId: string;
}
```

**Video Status Flow:**
```
PENDING → DOWNLOADING → PROCESSING → [transcoding] → READY
                     ↓
                   ERROR
```

### Video Transcoding Worker (`src/workers/video-transcode.ts`)

**Responsibilities:**
1. Receives transcoding jobs from the queue
2. Downloads source video from storage
3. Transcodes to HLS format with multiple quality levels
4. Generates thumbnail images
5. Uploads HLS segments to storage
6. Updates video status to READY

**Configuration:**
- Concurrency: 1 (transcoding is CPU-intensive)
- Rate limit: 5 jobs per minute
- Transcode directory: `/tmp/safestream/transcode`

**HLS Quality Profiles:**
- 360p: 800k video bitrate, 96k audio
- 480p: 1400k video bitrate, 128k audio
- 720p: 2800k video bitrate, 128k audio

**Job Data:**
```typescript
{
  videoId: string;
  sourceKey: string; // S3 key for source video
  familyId: string;
}
```

**Output:**
- Master playlist: `videos/{familyId}/{videoId}/hls/master.m3u8`
- Variant playlists: `360p.m3u8`, `480p.m3u8`, `720p.m3u8`
- Segments: `360p_000.ts`, `360p_001.ts`, etc.
- Thumbnails: `videos/{familyId}/{videoId}/thumbnails/thumb_0.jpg`, etc.

## Storage Structure

```
videos/
  {familyId}/
    {videoId}/
      original.mp4           # Original downloaded video
      hls/
        master.m3u8          # Master playlist
        360p.m3u8            # 360p variant playlist
        360p_000.ts          # 360p segment 0
        360p_001.ts          # 360p segment 1
        480p.m3u8
        480p_000.ts
        ...
        720p.m3u8
        720p_000.ts
        ...
      thumbnails/
        thumb_0.jpg          # Thumbnail at 1/6 duration
        thumb_1.jpg          # Thumbnail at 2/6 duration
        ...
thumbnails/
  {videoId}.jpg              # Main thumbnail
```

## Monitoring Workers

### View Queue Status

```bash
# Using Redis CLI
redis-cli

# Check queue length
LLEN bull:video-download:wait
LLEN bull:video-transcode:wait

# Check active jobs
LLEN bull:video-download:active
LLEN bull:video-transcode:active

# Check failed jobs
LLEN bull:video-download:failed
LLEN bull:video-transcode:failed
```

### View Worker Logs

Workers use Pino logger with structured logging:

```bash
# All logs
pnpm workers | pino-pretty

# Filter by level
pnpm workers | grep "ERROR"
```

### Job Progress

Jobs report progress at various stages:
- Download: 10% → 20% → 60% → 80% → 90% → 100%
- Transcode: 10% → 20% → 70% → 85% → 95% → 100%

Progress can be monitored via BullMQ dashboard or custom admin UI.

## Error Handling

### Common Errors

**1. yt-dlp not found**
```
Error: yt-dlp is not installed
```
**Solution**: Install yt-dlp (see Prerequisites)

**2. FFmpeg not found**
```
Error: ffmpeg: command not found
```
**Solution**: Install FFmpeg (see Prerequisites)

**3. Private/unavailable video**
```
Error: This video is private and cannot be imported
```
**Solution**: Only public videos can be downloaded

**4. File size exceeded**
```
Error: File size exceeds maximum allowed size
```
**Solution**: Video is too large (>500MB). Adjust MAX_FILE_SIZE if needed.

**5. Storage upload failed**
```
Error: Failed to upload to storage
```
**Solution**: Check MinIO/S3 connection and credentials

### Failed Job Handling

Failed jobs are automatically retried:
- Download worker: 3 retries with exponential backoff
- Transcode worker: 2 retries with exponential backoff

Videos that fail permanently are marked with `status: 'ERROR'` and include error details in the `notes` field.

## Performance Tuning

### Concurrency

Adjust concurrency based on available resources:

```typescript
// video-download.ts
concurrency: 2, // Increase for more simultaneous downloads

// video-transcode.ts
concurrency: 1, // Keep at 1 unless you have multiple CPU cores
```

### Rate Limiting

Prevent overloading external services:

```typescript
limiter: {
  max: 10,        // Max jobs
  duration: 60000, // Per minute
}
```

### Storage Optimization

**Video Retention:**
- Keep original video for 7 days, then delete
- Keep HLS files indefinitely
- Generate thumbnails on-demand

**Disk Space:**
- Monitor `/tmp/safestream` directory
- Clean up failed jobs: `rm -rf /tmp/safestream/*/`
- Set up automatic cleanup cron job

## Testing

### Test Download Worker

```bash
# Start worker
pnpm workers:download

# In another terminal, queue a test job
# Use the admin UI to import a short test video
```

### Test Transcode Worker

```bash
# Start worker
pnpm workers:transcode

# Worker will automatically process videos after download
```

### Test End-to-End

1. Start all services: `pnpm docker:dev:up`
2. Start workers: `pnpm workers`
3. Start web app: `pnpm dev`
4. Import a short YouTube video (<5 min)
5. Monitor logs in worker terminal
6. Check video status in admin UI
7. Verify HLS files in MinIO browser (http://localhost:9001)

## Production Deployment

### Docker Compose

Add worker service to `docker-compose.prod.yml`:

```yaml
services:
  workers:
    build:
      context: .
      dockerfile: Dockerfile.workers
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - STORAGE_ENDPOINT=${STORAGE_ENDPOINT}
      - STORAGE_ACCESS_KEY=${STORAGE_ACCESS_KEY}
      - STORAGE_SECRET_KEY=${STORAGE_SECRET_KEY}
    depends_on:
      - postgres
      - redis
      - minio
    restart: unless-stopped
```

### Health Checks

Workers should expose health check endpoints:

```typescript
// Add to worker manager
import express from 'express';

const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});
app.listen(3001);
```

### Scaling

For high-volume processing:
- Run multiple worker instances
- Use Redis cluster for queue
- Use S3 (not MinIO) for storage
- Add CDN for HLS delivery

## Troubleshooting

**Workers not picking up jobs:**
- Check Redis connection
- Verify queue names match
- Check worker logs for errors

**Slow transcoding:**
- Check CPU usage
- Reduce quality profiles
- Use hardware acceleration (if available)

**Disk space issues:**
- Monitor `/tmp` directory
- Implement cleanup cron job
- Move temp directory to larger volume

**Video playback issues:**
- Verify HLS files uploaded correctly
- Check CORS configuration on storage
- Test with VLC or another HLS player first

## Next Steps

- **SSK-041**: Video Approval Queue - UI for reviewing imported videos
- **SSK-047**: Video Transcription Worker - Generate subtitles
- **SSK-040**: Thumbnail Generation - Enhanced thumbnail extraction
