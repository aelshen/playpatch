# RealDebrid Integration Testing Guide

This guide will help you test the complete RealDebrid integration end-to-end.

## Prerequisites

✅ RealDebrid API key configured in `.env`
✅ Development server running (`pnpm dev:all`)
✅ Database migrations applied
✅ Background workers running

## Test Workflow

### 1. Access the Import Page

1. Navigate to: http://localhost:3000/admin/content/import
2. You should see two tabs: **YouTube** and **RealDebrid**
3. Click the **RealDebrid** tab (🧲 icon)

### 2. Test Magnet Link Preview

**Test with a small, legal magnet link (for testing, use a public domain video):**

Example test magnet (Ubuntu ISO):
```
magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c356&dn=ubuntu-22.04.1-desktop-amd64.iso
```

Or use any small, legal torrent magnet link.

**Steps:**
1. Paste magnet link in the input field
2. Click **Preview Files**
3. Wait 5-10 seconds
4. You should see:
   - Torrent name
   - Total size
   - List of all files with individual sizes
   - Checkboxes for file selection

**✅ Expected:** File list appears with proper formatting
**❌ If fails:** Check `.workers.log` and browser console for errors

### 3. Test File Selection

1. By default, video files (`.mp4`, `.mkv`, etc.) should be pre-selected
2. Try clicking checkboxes to select/deselect files
3. Use "Select All" and "Select None" buttons
4. Ensure at least one file is selected

**✅ Expected:** Checkboxes toggle correctly
**❌ If fails:** Check browser console for JavaScript errors

### 4. Test Import

1. With files selected, click **Import Selected Files**
2. Wait 10-30 seconds (RealDebrid needs to process)
3. You should see a success message with:
   - Number of videos imported
   - "What happens next" explanation
   - Auto-redirect countdown

**✅ Expected:** Success message appears, redirect to /admin/content
**❌ If fails:** Check error message. Common issues:
   - Invalid API key
   - RealDebrid rate limit (250 req/min)
   - Torrent not available

### 5. Verify Video Records

1. On the content library page, you should see:
   - New video cards with **🧲 RealDebrid** badge
   - Status: **PENDING** (awaiting approval)
   - Purple color scheme for RealDebrid videos

**✅ Expected:** Videos appear with RealDebrid badge
**❌ If fails:** Check database - videos should exist with `sourceType='REALDEBRID'`

### 6. Test Approval Flow

1. Click **Awaiting Approval** stat card (or navigate to `/admin/content/approval`)
2. Find your RealDebrid videos
3. Click on a video to see details
4. Click **Approve** button
5. Status should change to **DOWNLOADING**

**✅ Expected:** Video status updates to DOWNLOADING
**❌ If fails:** Check worker logs for queue errors

### 7. Monitor Download Progress

1. Check worker logs: `tail -f .workers.log`
2. You should see:
   ```
   Adding magnet to RealDebrid
   Magnet added successfully
   Selecting torrent files
   Files selected successfully
   Waiting for torrent download
   RealDebrid download completed
   Got download link
   ```

3. The video card should progress through statuses:
   - **PENDING** → **DOWNLOADING** → **PROCESSING** → **READY**

**⏱️ Time:** Depends on torrent size and RealDebrid speed (1-10 minutes)

**✅ Expected:** Video eventually reaches READY status
**❌ If fails:** Common issues:
   - RealDebrid download timeout (torrent not seeded)
   - File size exceeds 500MB limit
   - Storage upload errors

### 8. Verify Transcoding

1. Once status is **PROCESSING**, transcoding has begun
2. Check that video progresses to **READY**
3. Video should have transcoded versions in storage

**✅ Expected:** Multiple quality versions created
**❌ If fails:** Check transcode worker logs

### 9. Test Video Playback

1. Once status is **READY**, click on the video
2. Try playing it
3. Test different quality settings
4. Verify thumbnail displays

**✅ Expected:** Video plays smoothly
**❌ If fails:** Check video file in storage, verify formats

### 10. Test Error Handling

**Test invalid magnet link:**
```
magnet:?xt=urn:btih:invalid
```

**✅ Expected:** Clear error message shown
**❌ If fails:** Error should be caught and displayed

**Test empty file selection:**
1. Preview a magnet
2. Deselect all files
3. Try to import

**✅ Expected:** "Please select at least one file" error
**❌ If fails:** Validation not working

## Edge Cases to Test

### Multi-File Torrents

1. Find a torrent with 5+ video files (e.g., a TV show season)
2. Import only 2-3 files
3. Verify only selected files create video records

### Large Files

1. Test with a file >100MB (but <500MB)
2. Monitor download time
3. Verify it completes successfully

### Already Imported

1. Try importing the same magnet link twice
2. Should get "already imported" error

### Concurrent Imports

1. Import 2-3 different torrents at once
2. Verify all process correctly
3. Check for race conditions

## Troubleshooting

### RealDebrid API Errors

**Error: "RealDebrid API key not configured"**
- Check `.env` file has `REALDEBRID_API_KEY`
- Restart dev server after adding key

**Error: "Rate limit exceeded"**
- RealDebrid limits to 250 req/min
- Wait a minute and try again

**Error: "Torrent not available" or "No files found"**
- Magnet link may be invalid
- Torrent may not have any seeders
- Try a different magnet link

### Download Worker Issues

**Videos stuck in DOWNLOADING status:**
1. Check worker is running: `ps aux | grep worker`
2. Check logs: `tail -f .workers.log`
3. Check RealDebrid website - torrent may be stuck there

**Error: "Failed to download: 404"**
- RealDebrid link expired (usually 1-2 hours)
- Re-approve the video to generate new link

### Storage Issues

**Error: "Failed to upload to storage"**
- Check MinIO is running: `docker ps | grep minio`
- Check storage path exists
- Verify MinIO credentials in `.env`

## Performance Metrics

Expected timings for a 50MB video:

| Step | Time |
|------|------|
| Preview magnet | 2-5 seconds |
| Import (create records) | 10-20 seconds |
| RealDebrid download | 1-5 minutes |
| Fetch to local storage | 30-60 seconds |
| Transcode | 2-5 minutes |
| **Total** | **5-12 minutes** |

## Success Criteria

✅ All imports complete without errors
✅ Videos are viewable and playable
✅ Status updates reflect actual progress
✅ UI shows RealDebrid badges correctly
✅ Error messages are clear and helpful
✅ Multi-file torrents work properly
✅ No memory leaks or hanging processes

## Cleanup After Testing

```bash
# Stop workers
pnpm dev:stop

# Clean up test videos (optional)
# Delete from admin UI or database

# Check Docker containers
docker ps

# View logs if needed
tail -100 .workers.log
```

## Next Steps

Once all tests pass:
1. Test with real educational content
2. Monitor production performance
3. Set up alerting for failed downloads
4. Consider adding RealDebrid cache status indicator
5. Add download progress percentage (optional enhancement)

## Report Issues

If you encounter bugs during testing:
1. Note the exact error message
2. Check browser console (F12)
3. Check worker logs (`.workers.log`)
4. Check Docker logs (`pnpm docker:logs`)
5. Share relevant log snippets

---

**Happy Testing! 🧲**
