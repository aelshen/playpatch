# RealDebrid Direct Streaming (Stremio-Style)

## Overview

PlayPatch now supports **direct streaming from RealDebrid** without downloading files to local storage, similar to how Stremio works with RealDebrid.

## How It Works

```
1. User adds magnet/torrent link
   ↓
2. RealDebrid downloads it to their servers
   ↓
3. PlayPatch gets HTTPS streaming link from RealDebrid
   ↓
4. Video streams directly from RealDebrid
   ↓
5. No local download or transcoding needed! ✨
```

## Setup

### 1. Enable RealDebrid Streaming Mode

Add to your `.env`:

```bash
# Your RealDebrid API key (already set)
REALDEBRID_API_KEY=your_api_key_here

# Enable streaming mode (new)
REALDEBRID_STREAM_MODE=true

# Optional: Keep both modes available
REALDEBRID_ALLOW_DOWNLOAD=true
```

### 2. Import Content with Streaming

When importing via RealDebrid:
1. Provide magnet link or torrent hash
2. Select the video file you want
3. Click "Import"
4. PlayPatch will mark it as streamable

### 3. Watch Instantly

- No waiting for download
- No transcoding needed
- Instant playback from RealDebrid's servers
- Full seeking support
- Quality depends on source file

## Streaming vs Download Mode

### Streaming Mode (Stremio-style)
**Pros:**
- ✅ Instant playback - no waiting
- ✅ No local storage used
- ✅ No transcoding needed
- ✅ RealDebrid handles bandwidth

**Cons:**
- ❌ Requires active RealDebrid account
- ❌ Limited by RealDebrid's retention (14-30 days)
- ❌ No offline access
- ❌ Depends on RealDebrid uptime

### Download Mode (Traditional)
**Pros:**
- ✅ Permanent local copy
- ✅ Offline access
- ✅ Transcoded to HLS (multiple qualities)
- ✅ No ongoing RealDebrid dependency

**Cons:**
- ❌ Requires storage space
- ❌ Download + transcode time
- ❌ Uses bandwidth twice (download then serve)

## API Endpoints

### Stream Video from RealDebrid

```
GET /api/stream/realdebrid/{videoId}
```

**Response:** Video stream (proxied from RealDebrid)

**Headers:**
- `Accept-Ranges: bytes` - Seeking support
- `Content-Type: video/mp4` - MIME type
- `Cache-Control: public, max-age=31536000` - Browser caching

### Check Stream Availability

```
GET /api/videos/{videoId}/stream-info
```

**Response:**
```json
{
  "streamable": true,
  "streamUrl": "/api/stream/realdebrid/{videoId}",
  "filename": "Movie.Name.2024.1080p.mp4",
  "size": 2147483648,
  "expiresAt": "2024-02-15T00:00:00Z"
}
```

## Video Player Integration

The video player automatically detects streamable RealDebrid videos:

```tsx
// If video.sourceType === 'REALDEBRID' and streamable
<video>
  <source src="/api/stream/realdebrid/{videoId}" type="video/mp4" />
</video>
```

## Configuration Options

Add these to your `.env`:

```bash
# Streaming behavior
REALDEBRID_STREAM_MODE=true          # Enable streaming
REALDEBRID_ALLOW_DOWNLOAD=true       # Also allow downloading
REALDEBRID_AUTO_STREAM=true          # Default to streaming for new imports

# Storage preferences
REALDEBRID_STREAM_ONLY=false         # Never download, only stream
REALDEBRID_DOWNLOAD_BACKUP=true      # Download copy after 7 days
```

## Comparing to Stremio

| Feature | Stremio + RealDebrid | PlayPatch + RealDebrid |
|---------|---------------------|------------------------|
| Direct streaming | ✅ Yes | ✅ Yes |
| Torrent/Magnet support | ✅ Yes | ✅ Yes |
| Parental controls | ❌ No | ✅ Yes |
| Content approval | ❌ No | ✅ Yes |
| Child profiles | ❌ No | ✅ Yes |
| Time limits | ❌ No | ✅ Yes |
| Local downloads | ❌ No | ✅ Optional |
| Transcoding | ❌ No | ✅ Optional |
| Self-hosted | ✅ Yes | ✅ Yes |

## Advantages Over Stremio

1. **Parental Control:** Every video must be approved before kids can watch
2. **Child Profiles:** Multiple kids with age-appropriate content
3. **Time Management:** Built-in viewing limits and schedules
4. **Flexibility:** Can stream OR download based on needs
5. **Privacy:** Your viewing history stays on your server

## Usage Examples

### Example 1: Stream a Movie

1. Go to Content → Import from RealDebrid
2. Paste magnet link
3. Select video file
4. Enable "Stream only (don't download)"
5. Click Import
6. Approve for viewing
7. Watch instantly!

### Example 2: Stream First, Download Later

1. Import with streaming enabled
2. Watch immediately via stream
3. Later: Click "Download for offline"
4. PlayPatch downloads and transcodes in background
5. Now have both: instant stream + local copy

### Example 3: Hybrid Mode

```bash
# .env configuration
REALDEBRID_STREAM_MODE=true
REALDEBRID_ALLOW_DOWNLOAD=true
REALDEBRID_DOWNLOAD_BACKUP=true
```

- New imports: Stream immediately
- After 7 days: Auto-download to local storage
- Best of both worlds!

## Troubleshooting

### "Not streamable from RealDebrid"

Some files aren't marked as streamable by RealDebrid. Solutions:
- Try downloading instead
- File might be corrupted
- RealDebrid might not support that format

### Stream buffering/stuttering

- Check your internet speed (need 10+ Mbps for 1080p)
- RealDebrid servers might be slow
- Try downloading instead for better experience

### Stream expired/not found

RealDebrid deletes torrents after inactivity (14-30 days):
- Re-add the magnet link
- Or switch to download mode for permanent storage

## Cost Comparison

### Streaming Mode
- Storage: **0 bytes** (stays on RealDebrid)
- Bandwidth: **Outbound only** (serving to clients)
- Processing: **None** (no transcoding)

### Download Mode
- Storage: **~2GB per 1080p movie**
- Bandwidth: **Inbound + outbound**
- Processing: **High** (transcoding to HLS)

For a family watching 50 movies/month:
- **Streaming:** ~0GB storage, minimal processing
- **Download:** ~100GB storage, significant CPU usage

## Legal Note

⚠️ **Important:** Only stream content you have the legal right to access. RealDebrid and PlayPatch do not endorse piracy.

## Future Enhancements

Planned features:
- [ ] Auto-cleanup of expired streams
- [ ] Bandwidth monitoring per child
- [ ] Stream quality selection (when available)
- [ ] Intelligent stream vs download recommendations
- [ ] Multi-CDN support (RealDebrid + local)

---

**TL;DR:** PlayPatch now works like Stremio - instant streaming from RealDebrid without downloads, while adding parental controls and flexibility.
