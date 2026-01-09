# YouTube Video Import Setup

## Overview

SSK-037 implements YouTube video import functionality using `yt-dlp` to extract metadata and download videos.

## Prerequisites

### 1. Install yt-dlp

yt-dlp is required for extracting YouTube video metadata and downloading videos.

**macOS (Homebrew):**
```bash
brew install yt-dlp
```

**Linux (pip):**
```bash
pip install yt-dlp
# or
python3 -m pip install yt-dlp
```

**Windows (pip):**
```bash
pip install yt-dlp
```

**Verify Installation:**
```bash
yt-dlp --version
```

### 2. Optional: FFmpeg

FFmpeg is recommended for better video processing and format conversion.

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

## Features Implemented

### Video Import Flow

1. **Metadata Extraction** (`lib/media/youtube.ts`)
   - Extract video ID from URL
   - Fetch video metadata using yt-dlp
   - Extract title, description, duration, thumbnail, channel info
   - Suggest age rating based on content analysis
   - Map YouTube categories to SafeStream categories

2. **Server Actions** (`lib/actions/video-import.ts`)
   - `importYouTubeVideoAction`: Import video and queue for download
   - `previewYouTubeVideoAction`: Preview metadata before importing
   - Validation and error handling

3. **UI Components** (`components/admin/import-form.tsx`)
   - URL input with validation
   - Real-time feedback during import
   - Success/error messaging
   - Auto-redirect to content library

4. **Import Page** (`app/admin/content/import/page.tsx`)
   - Clean, user-friendly interface
   - Help text and requirements
   - Integration with existing admin layout

## How It Works

### 1. User Enters YouTube URL
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### 2. Metadata Extraction
The system uses yt-dlp to extract video information without downloading:
```bash
yt-dlp --dump-json --no-download "URL"
```

### 3. Channel Creation/Lookup
If the video's channel doesn't exist in the database, it's automatically created.

### 4. Video Record Creation
A video record is created with:
- Status: `PENDING`
- Approval Status: `PENDING`
- Suggested age rating (based on title/description analysis)
- Suggested categories (mapped from YouTube categories/tags)
- Thumbnail URL
- All metadata

### 5. Download Job Queued
The video is added to the `videoDownloadQueue` for background processing (SSK-038).

### 6. Approval Workflow
Videos require parental approval (SSK-041) before they're available to children.

## Age Rating Suggestions

The system automatically suggests age ratings based on:

- **AGE_2_PLUS**: Videos with "baby", "toddler", "nursery", "lullaby" keywords
- **AGE_4_PLUS**: Educational content for preschoolers
- **AGE_7_PLUS**: General kids content (default)
- **AGE_10_PLUS**: More advanced content

Parents can override these suggestions during the approval process.

## Category Mapping

YouTube categories and tags are mapped to SafeStream categories:

| SafeStream Category | YouTube Keywords |
|---------------------|------------------|
| EDUCATIONAL | education, science, learning |
| ENTERTAINMENT | entertainment, gaming, comedy |
| MUSIC | music, songs, nursery rhymes |
| ANIMATION | animation, cartoon |
| STORIES | stories, storytelling, books |
| ARTS_CRAFTS | art, craft, diy, drawing |
| NATURE | nature, animals, wildlife |

## Error Handling

The import system handles common errors:

- **yt-dlp not installed**: Clear error message with installation instructions
- **Private videos**: "This video is private and cannot be imported"
- **Unavailable videos**: "This video is unavailable or has been removed"
- **Age-restricted videos**: "This video requires age verification"
- **Duplicate imports**: Prevents importing the same video twice
- **Invalid URLs**: Validates URL format before processing

## Security Considerations

1. **URL Validation**: Only YouTube URLs are accepted
2. **Command Injection Prevention**: URLs are properly escaped in shell commands
3. **User Authentication**: Import requires authenticated parent/admin user
4. **Family Isolation**: Videos are scoped to the importing family
5. **Approval Workflow**: All imported videos require approval before children can access

## Testing the Feature

### 1. Start the Development Server
```bash
pnpm dev
```

### 2. Navigate to Import Page
```
http://localhost:3000/admin/content/import
```

### 3. Test with Sample URLs

**Educational Content:**
```
https://www.youtube.com/watch?v=sample-education-video
```

**Music/Nursery Rhymes:**
```
https://www.youtube.com/watch?v=sample-music-video
```

### 4. Verify in Content Library
After import, check `/admin/content` to see the video listed with:
- PENDING status
- Suggested age rating and categories
- Thumbnail
- Download job queued

## Next Steps

The following features build on YouTube import:

- **SSK-038**: Video Download Worker - Background job to download videos
- **SSK-039**: Video Transcoding Worker - Convert videos to HLS format
- **SSK-041**: Video Approval Queue - UI for reviewing and approving videos
- **SSK-047**: Video Transcription Worker - Generate subtitles

## Troubleshooting

### "yt-dlp command not found"
Install yt-dlp following the prerequisites section.

### "Failed to extract video information"
- Check if the video is publicly accessible
- Verify the URL is correct
- Ensure yt-dlp is up to date: `pip install --upgrade yt-dlp`

### "This video is private"
Private videos cannot be imported. Use publicly accessible videos only.

### Video already imported
Check `/admin/content` - the video may already exist in your library.

## Architecture Notes

### Files Created
- `lib/media/youtube.ts`: YouTube metadata extraction
- `lib/actions/video-import.ts`: Server actions for import
- `components/admin/import-form.tsx`: Import form UI
- `app/admin/content/import/page.tsx`: Import page (updated)

### Dependencies
- yt-dlp (system dependency)
- Existing Prisma schema (Video, Channel models)
- Existing BullMQ setup (videoDownloadQueue)
- NextAuth.js for authentication

### Database Changes
No schema changes required. Uses existing Video and Channel models.
