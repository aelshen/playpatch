# YouTube Download Troubleshooting

## Common Errors and Solutions

### Error: "YouTube is blocking downloads from this video"

**Cause:** YouTube returns HTTP 403 Forbidden errors for certain videos, especially:
- Age-restricted content
- Region-locked videos
- Videos that require sign-in
- Rate-limited requests

**Solutions:**

#### Option 1: Provide YouTube Cookies (Recommended)

YouTube cookies allow yt-dlp to download as if you're signed in to YouTube.

**Step 1: Export YouTube cookies from your browser**

Using a browser extension:
- Chrome/Edge: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

1. Install the extension
2. Go to youtube.com and make sure you're logged in
3. Click the extension icon
4. Export cookies for youtube.com
5. Save the file as `youtube-cookies.txt`

**Step 2: Configure PlayPatch to use cookies**

Add to your `.env` file:
```bash
YOUTUBE_COOKIES_PATH=/path/to/youtube-cookies.txt
```

Or place the cookies file at:
```
/Users/yourusername/playpatch/youtube-cookies.txt
```

**Step 3: Restart workers**
```bash
pnpm dev:stop
pnpm dev:all
```

#### Option 2: Wait and Retry

YouTube sometimes rate limits downloads. Wait 15-30 minutes and try again.

#### Option 3: Try a Different Video

The specific video might have restrictions. Try:
- A different video from the same channel
- A public, non-restricted video first
- Shorter videos (under 10 minutes)

---

### Error: "Video is not available"

**Cause:** The video is private, deleted, or doesn't exist.

**Solutions:**
- Check if the YouTube URL is correct
- Verify the video plays in your browser
- The video might have been deleted or made private

---

### Error: "Video is age-restricted"

**Cause:** Video requires age verification.

**Solution:** Provide YouTube cookies from a logged-in account with verified age (see Option 1 above).

---

### Error: "File too large"

**Cause:** Video exceeds the 500MB size limit.

**Solutions:**
- Try shorter videos
- The limit is set for performance reasons
- For longer content, split into parts

---

## Download Fallback Strategies

PlayPatch automatically tries multiple download strategies:

1. **Best Quality (1080p):** Tries to download best video+audio up to 1080p
2. **Best Single File:** Falls back to single-file best quality
3. **Lower Quality (720p):** If 1080p fails, tries 720p

Each strategy is attempted automatically if the previous one fails.

---

## Checking yt-dlp Installation

Verify yt-dlp is installed:

```bash
yt-dlp --version
```

Should show version like: `2024.01.01`

**Update yt-dlp:**
```bash
# macOS
brew upgrade yt-dlp

# Linux
pip install --upgrade yt-dlp
```

---

## Testing Downloads Manually

Test a download outside of PlayPatch:

```bash
yt-dlp --format "best[height<=1080]" \
  --output "/tmp/test.mp4" \
  "https://www.youtube.com/watch?v=VIDEO_ID"
```

With cookies:
```bash
yt-dlp --cookies youtube-cookies.txt \
  --format "best[height<=1080]" \
  --output "/tmp/test.mp4" \
  "https://www.youtube.com/watch?v=VIDEO_ID"
```

---

## Understanding Error Messages

PlayPatch now shows user-friendly error messages with specific suggestions:

### Example Error Display:
```
YouTube is blocking downloads from this video

Suggestions:
- This video may be age-restricted or region-locked
- Try providing YouTube cookies (sign in to YouTube in your browser first)
- The video might be available later - YouTube sometimes rate limits downloads
- Try a different video or check if the video is publicly accessible
```

The job will automatically retry 3 times before permanently failing.

---

## Viewing Worker Logs

Check what's happening during downloads:

```bash
# View real-time worker logs
tail -f .workers.log

# View last 50 lines
tail -50 .workers.log

# Search for errors
grep ERROR .workers.log
```

---

## YouTube's Restrictions

YouTube actively works to prevent automated downloads:

**Why does YouTube block downloads?**
- Copyright protection
- Control over content distribution
- Prevent abuse and scraping
- Enforce terms of service

**Legal note:** Only download videos you have permission to download or that are in the public domain.

---

## Advanced: Cookies File Format

The cookies.txt file should be in Netscape format:

```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1234567890	CONSENT	YES+cb
.youtube.com	TRUE	/	FALSE	1234567890	VISITOR_INFO1_LIVE	abcdefg
```

Never share your cookies file - it contains your login session!

---

## Still Having Issues?

1. **Update yt-dlp:** `brew upgrade yt-dlp` (macOS) or `pip install --upgrade yt-dlp`
2. **Check YouTube status:** Visit youtube.com to see if it's accessible
3. **Try incognito:** Test the video URL in an incognito browser window
4. **Check logs:** Look at `.workers.log` for detailed error messages
5. **Report issue:** Create an issue with the video URL and error message

---

## Environment Variables Reference

Add these to your `.env` file:

```bash
# YouTube cookies for authenticated downloads
YOUTUBE_COOKIES_PATH=/path/to/youtube-cookies.txt

# Maximum video file size (default: 500MB)
MAX_VIDEO_SIZE_MB=500

# Temporary download directory
TEMP_DOWNLOAD_DIR=/tmp/playpatch/downloads
```

---

**Last Updated:** January 30, 2026
