# Storage Configuration

## Network Storage Setup

All PlayPatch content is now configured to be stored on your network location.

### Current Configuration

**Storage Location:** `/Volumes/DS920/Media/PlayPatch`

This directory contains:
```
/Volumes/DS920/Media/PlayPatch/
├── videos/       # Downloaded and transcoded videos
├── thumbnails/   # Video thumbnails
├── avatars/      # User and child profile avatars
└── journals/     # Journal entries and attachments
```

### What Gets Stored Here

**Permanent Storage (Network Location):**
- ✅ Downloaded videos (original files)
- ✅ Transcoded HLS video segments (360p, 480p, 720p)
- ✅ Video thumbnails
- ✅ User profile avatars
- ✅ Child profile avatars
- ✅ Journal entries with media
- ✅ Any uploaded content

**Temporary Storage (Local `/tmp`):**
- 🔄 Video downloads in progress (deleted after processing)
- 🔄 Transcoding work files (deleted after completion)
- 🔄 Temporary processing artifacts

### How It Works

1. **Download Phase:**
   - Video downloaded to `/tmp/safestream/downloads/` (temporary)
   - After download completes, moved to network storage
   - Temp files cleaned up

2. **Transcode Phase:**
   - Original video read from network storage
   - Transcoding done in `/tmp/safestream/transcode/` (temporary)
   - HLS segments saved directly to network storage
   - Temp files cleaned up

3. **Access:**
   - Web app serves videos from network storage
   - Next.js has direct access via filesystem
   - No MinIO/S3 needed for local deployment

### Configuration Files

**.env:**
```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/Volumes/DS920/Media/PlayPatch
```

**Worker Environment Variables (optional):**
```bash
# Defaults to /tmp/safestream if not set
TEMP_DOWNLOAD_DIR=/tmp/playpatch/downloads
TEMP_TRANSCODE_DIR=/tmp/playpatch/transcode
```

### Verifying Configuration

```bash
# Check storage path in .env
grep LOCAL_STORAGE_PATH .env

# Verify directory exists and is writable
ls -la /Volumes/DS920/Media/PlayPatch/

# Check available space
df -h /Volumes/DS920/Media/
```

### Monitoring Storage Usage

```bash
# Check total size of videos
du -sh /Volumes/DS920/Media/PlayPatch/videos/

# List largest files
find /Volumes/DS920/Media/PlayPatch/ -type f -exec du -h {} + | sort -rh | head -20

# Count files by type
find /Volumes/DS920/Media/PlayPatch/videos/ -name "*.mp4" | wc -l
find /Volumes/DS920/Media/PlayPatch/videos/ -name "*.ts" | wc -l
```

### Network Drive Considerations

**Performance:**
- Network storage may be slower than local SSD
- Transcoding performance depends on network speed
- Consider transcoding locally then moving to network storage if needed

**Reliability:**
- Ensure network drive is always mounted
- Add mount check to startup scripts if needed
- Consider backup strategy for network storage

**Access:**
- Network drive must be mounted at boot
- Path must be accessible by the user running the app
- Permissions must allow read/write

### Changing Storage Location

To change to a different location:

1. **Stop services:**
   ```bash
   pnpm dev:stop
   ```

2. **Update .env:**
   ```bash
   LOCAL_STORAGE_PATH=/new/path/to/storage
   ```

3. **Create directory structure:**
   ```bash
   mkdir -p /new/path/to/storage/{videos,thumbnails,avatars,journals}
   ```

4. **Optionally migrate existing content:**
   ```bash
   # Copy existing content if you want to keep it
   cp -r /Volumes/DS920/Media/PlayPatch/* /new/path/to/storage/
   ```

5. **Restart services:**
   ```bash
   pnpm dev:all
   ```

### Troubleshooting

**Issue: Permission denied**
```bash
# Check permissions
ls -la /Volumes/DS920/Media/PlayPatch/

# Fix permissions if needed
chmod -R 755 /Volumes/DS920/Media/PlayPatch/
```

**Issue: Network drive not mounted**
```bash
# Check if mounted
mount | grep DS920

# If not mounted, mount it manually or add to fstab
```

**Issue: Disk space full**
```bash
# Check available space
df -h /Volumes/DS920/

# Clean up old videos if needed (via web UI)
# Or manually remove old content
```

**Issue: Slow video playback**
- Network bandwidth may be the bottleneck
- Consider local caching for frequently accessed videos
- Upgrade network connection (1Gbps recommended)

### Storage Architecture

```
┌─────────────────────────────────────────────────┐
│              Web Application                     │
│         (reads from network storage)            │
└────────────┬────────────────────────────────────┘
             │
             ├─────────────────────────────────────┐
             │                                     │
   ┌─────────▼─────────┐              ┌──────────▼────────┐
   │  Download Worker  │              │  Transcode Worker │
   │                   │              │                   │
   │  1. Downloads to  │              │  1. Reads from    │
   │     /tmp/         │              │     network       │
   │  2. Moves to      │──────────────▶  2. Transcodes in │
   │     network       │              │     /tmp/         │
   │                   │              │  3. Saves to      │
   │                   │              │     network       │
   └───────────────────┘              └───────────────────┘
             │                                     │
             └──────────────┬──────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Network Storage (NAS)   │
              │ /Volumes/DS920/Media/     │
              │      PlayPatch/           │
              │                           │
              │  - videos/                │
              │  - thumbnails/            │
              │  - avatars/               │
              │  - journals/              │
              └───────────────────────────┘
```

### Benefits of Network Storage

✅ **Centralized:** All media in one location
✅ **Accessible:** Can be accessed by multiple devices
✅ **Scalable:** NAS typically has more storage than local drive
✅ **Backup:** NAS usually has RAID and backup solutions
✅ **Sharing:** Easy to access from other apps/services

### Recommended Network Setup

**Minimum Requirements:**
- 100 Mbps network connection
- NAS with SMB/NFS support
- Reliable network (wired preferred over WiFi)

**Optimal Setup:**
- 1 Gbps network connection
- NAS with SSD cache
- 10 Gbps if serving multiple concurrent streams

---

**Current Status:** ✅ Configured to use `/Volumes/DS920/Media/PlayPatch`
**Date Configured:** January 30, 2026
