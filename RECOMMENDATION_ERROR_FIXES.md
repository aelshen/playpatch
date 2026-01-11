# Recommendation System Error Fixes

## Issues Identified

The recommendation API was returning 500 Internal Server Error. Root causes:

1. **Null/undefined handling** - Videos might have null or empty `topics` and `categories` arrays
2. **Database query errors** - `hasSome` operator failing on edge cases
3. **No watch history fallback** - `getMostWatchedVideos` failing when no sessions exist yet
4. **Empty excludeIds array** - Prisma `notIn` with empty array causing issues

## Fixes Applied

### 1. Enhanced Error Logging (`/api/recommendations/[videoId]/route.ts`)
- Added detailed error logging with stack traces
- Returns error details in response for easier debugging
- Logs videoId and childProfileId for context

### 2. Defensive Coding in Engine (`/lib/recommendations/engine.ts`)
- Wrapped each recommendation source in try-catch blocks
- Added Array.isArray() checks before processing
- Returns empty array on errors instead of throwing
- Logs errors for each recommendation source separately

### 3. Database Query Safety (`/lib/db/queries/recommendations.ts`)

#### `getChildWatchedVideoIds()`
- Wrapped in try-catch
- Returns empty array on error

#### `getVideosWithSimilarTopics()`
- Added null check: `if (!topics || topics.length === 0)`
- Wrapped in try-catch
- Only includes `notIn` clause if excludeIds has items
- Returns empty array on error

#### `getVideosInCategories()`
- Added null check: `if (!categories || categories.length === 0)`
- Wrapped in try-catch
- Only includes `notIn` clause if excludeIds has items
- Returns empty array on error

#### `getVideosFromChannel()`
- Wrapped in try-catch
- Only includes `notIn` clause if excludeIds has items
- Returns empty array on error

#### `getMostWatchedVideos()`
- Wrapped in try-catch
- Added fallback when no watch sessions exist
- Returns most recent videos instead when watchCounts is empty
- Returns empty array on error

### 4. Empty Results Handling (`/lib/recommendations/engine.ts`)
- Added check for empty candidates array
- Logs when no candidates found
- Returns empty array instead of trying to score nothing

## Testing Checklist

### Basic Functionality
- [ ] Navigate to any video page
- [ ] Check that sidebar shows "Suggested Videos" without errors
- [ ] Verify recommendations load (may show fallback message initially)
- [ ] Click on a suggested video to ensure navigation works

### Error Handling
- [ ] Check browser console - should see no 500 errors
- [ ] Check server logs - should see detailed error info if any issues
- [ ] Verify fallback message shows if recommendations API fails

### Different Scenarios
- [ ] Test with video that has categories/topics
- [ ] Test with video that has empty categories/topics
- [ ] Test with brand new family (no watch history)
- [ ] Test with family that has watch history
- [ ] Test navigating between different videos

### Edge Cases
- [ ] Video with no channel
- [ ] Video with no other videos from same channel
- [ ] Child profile with no watch history
- [ ] Family with only 1 video

## What Should Happen Now

1. **Server starts without errors**
2. **Recommendation API responds with 200** (even if empty recommendations)
3. **Sidebar shows either:**
   - Smart recommendations (if algorithm finds matches)
   - Fallback videos (same channel videos from server)
   - Empty state (if no videos available)
4. **Error message displays** if API fails (instead of crash)
5. **Console logs show** which recommendation sources work/fail

## Monitoring

Check server logs for these messages:
- `Error in getChildWatchedVideoIds:` - Watch history query failed
- `Error in getVideosWithSimilarTopics:` - Topic matching failed
- `Error in getVideosInCategories:` - Category matching failed
- `Error in getVideosFromChannel:` - Channel query failed
- `Error in getMostWatchedVideos:` - Popularity query failed
- `Error fetching topic videos:` - Topic source failed in engine
- `Error fetching category videos:` - Category source failed in engine
- `Error fetching channel videos:` - Channel source failed in engine
- `Error fetching popular videos:` - Popularity source failed in engine
- `No candidate videos found for recommendations` - All sources returned empty

## Next Steps

If errors persist:

1. **Check server console output** for specific error messages
2. **Verify database** has videos with categories/topics populated
3. **Check Prisma schema** matches database structure
4. **Run migrations** if schema changed: `pnpm db:migrate`
5. **Seed data** if database is empty: `pnpm db:seed`

## Performance Notes

The recommendation engine now:
- Continues working even if individual sources fail
- Falls back gracefully to channel videos or recent videos
- Logs errors without breaking the UI
- Returns empty arrays instead of throwing exceptions

Each recommendation source is independent, so if topics matching fails, categories and channel recommendations still work.
