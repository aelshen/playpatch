# Phase 1: Make It Usable

**Duration:** 3-4 weeks
**Goal:** Children can browse, search, and watch videos independently
**Status:** 📋 Planned

## Overview

This phase focuses on building the core child-facing interface. Success means a 5-year-old can open PlayPatch and watch their favorite videos without parent help.

## Success Criteria

- ✅ Child can browse videos without help
- ✅ Video player works reliably with progress tracking
- ✅ "Continue Watching" shows partially watched videos
- ✅ Search works with simple text input
- ✅ UI is touch-friendly (min 88x88px targets)
- ✅ Load time <3s for video list
- ✅ Zero critical bugs in core flows

## Key Features

### 1. Age-Adaptive Home Screens

**Toddler Mode (Ages 2-4):**
- Extra large touch targets (120x120px minimum)
- Icon-only navigation (no text required)
- 6-8 category buttons max
- Bright, high-contrast colors
- Sound/haptic feedback
- No scrolling on main screen

**Explorer Mode (Ages 5-12):**
- Sidebar navigation
- Text + icons
- Horizontal scrolling rows (Netflix-style)
- Search bar
- Continue watching section
- Category browsing

### 2. Video Player with Progress Tracking

**Core Features:**
- HLS streaming (already implemented)
- Play/pause/seek controls
- Resume from last position
- Progress bar
- Fullscreen mode
- Volume control
- Captions toggle (when available)

**Child-Safe Features:**
- No external links
- No comments
- Curated "Up Next" only
- Idle timeout (configurable)

### 3. Continue Watching

**Requirements:**
- Shows videos with >10% and <90% completion
- Sorted by most recent
- Shows progress bar on thumbnail
- Max 10 videos
- "Remove from Continue Watching" option

### 4. Search & Discovery

**Basic Search:**
- Text input with simple UI
- Search titles and descriptions
- Filter by age rating
- Sort by: relevance, recent, duration
- Show result count

**Category Browsing:**
- Predefined categories from database
- Filter by child's age rating
- Show video count per category

### 5. Favorites & Playlists

**Favorites:**
- Heart icon to favorite
- Favorites page (grid view)
- Sort by date added
- Unfavorite option

**Playlists (Basic):**
- View playlists assigned to profile
- Play playlist (queue videos)
- See progress in playlist

## Technical Specifications

### Database Schema Changes

```sql
-- Already exists, verify completeness
CREATE TABLE IF NOT EXISTS watch_sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id),
  video_id TEXT NOT NULL REFERENCES videos(id),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER NOT NULL DEFAULT 0, -- seconds watched
  last_position INTEGER NOT NULL DEFAULT 0, -- seconds
  completed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(profile_id, video_id)
);

CREATE INDEX idx_watch_sessions_profile ON watch_sessions(profile_id);
CREATE INDEX idx_watch_sessions_video ON watch_sessions(video_id);
CREATE INDEX idx_watch_sessions_updated ON watch_sessions(started_at DESC);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id),
  video_id TEXT NOT NULL REFERENCES videos(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, video_id)
);

CREATE INDEX idx_favorites_profile ON favorites(profile_id);
```

### API Endpoints

```typescript
// Watch Session Tracking
POST   /api/watch/[videoId]/start
  Body: { profileId: string }
  Response: { sessionId: string }

POST   /api/watch/[videoId]/progress
  Body: { sessionId: string, position: number, duration: number }
  Response: { success: boolean }

POST   /api/watch/[videoId]/complete
  Body: { sessionId: string }
  Response: { success: boolean }

// Continue Watching
GET    /api/profiles/[profileId]/continue-watching
  Response: { videos: Video[], sessions: WatchSession[] }

// Search
GET    /api/search?q={query}&ageRating={rating}&category={cat}
  Response: { videos: Video[], total: number }

// Favorites
GET    /api/profiles/[profileId]/favorites
POST   /api/profiles/[profileId]/favorites
  Body: { videoId: string }
DELETE /api/profiles/[profileId]/favorites/[videoId]

// Categories
GET    /api/categories?profileId={id}
  Response: { categories: Category[], counts: Record<string, number> }
```

### Component Architecture

```
apps/web/src/
├── app/
│   ├── (child)/                    # Child-facing routes
│   │   ├── home/
│   │   │   └── page.tsx           # Home screen (mode-adaptive)
│   │   ├── watch/[videoId]/
│   │   │   └── page.tsx           # Video player page
│   │   ├── search/
│   │   │   └── page.tsx           # Search results
│   │   ├── favorites/
│   │   │   └── page.tsx           # Favorites grid
│   │   └── categories/[id]/
│   │       └── page.tsx           # Category videos
│   └── api/
│       └── (endpoints listed above)
│
├── components/
│   ├── child/                      # Child UI components
│   │   ├── home/
│   │   │   ├── ToddlerHome.tsx
│   │   │   ├── ExplorerHome.tsx
│   │   │   └── ContinueWatching.tsx
│   │   ├── player/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchResults.tsx
│   │   └── shared/
│   │       ├── VideoCard.tsx
│   │       ├── VideoGrid.tsx
│   │       └── CategoryButton.tsx
│   └── ui/                         # shadcn/ui components
│
└── lib/
    ├── db/
    │   └── queries/
    │       ├── watch-sessions.ts
    │       └── favorites.ts
    └── hooks/
        ├── useVideoPlayer.ts
        └── useWatchProgress.ts
```

### State Management

**Server State (Database):**
- Videos, profiles, watch sessions, favorites
- Use React Server Components by default

**Client State (React):**
- Video player state (playing, position, volume)
- Search query and filters
- UI state (modals, loading)

**Use Zustand for:**
```typescript
// apps/web/src/stores/player-store.ts
interface PlayerStore {
  currentVideo: Video | null;
  position: number;
  isPlaying: boolean;
  volume: number;
  setCurrentVideo: (video: Video) => void;
  updatePosition: (pos: number) => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
}
```

## Week-by-Week Breakdown

### Week 1: Core Player & Progress Tracking

**Days 1-2: Video Player Component**
- [ ] Build `VideoPlayer.tsx` with HLS.js integration
- [ ] Add player controls (play/pause/seek/volume)
- [ ] Implement fullscreen mode
- [ ] Add captions toggle
- [ ] Test on Safari, Chrome, Firefox

**Days 3-4: Progress Tracking**
- [ ] Create watch session schema and migrations
- [ ] Implement `/api/watch/*` endpoints
- [ ] Build `useWatchProgress` hook
- [ ] Auto-save progress every 10 seconds
- [ ] Resume on video load

**Day 5: Testing & Polish**
- [ ] Test resume across sessions
- [ ] Verify progress accuracy
- [ ] Handle edge cases (network loss, quick switches)
- [ ] Add loading states

**Acceptance Criteria:**
- Video plays smoothly
- Progress saves reliably
- Resume works after page refresh
- Controls are responsive

### Week 2: Home Screens & Continue Watching

**Days 1-2: ToddlerHome Component**
- [ ] Design large category buttons
- [ ] Implement icon-only navigation
- [ ] Add sound/haptic feedback
- [ ] Ensure 120x120px touch targets
- [ ] Test with actual toddler if possible

**Days 2-3: ExplorerHome Component**
- [ ] Build sidebar navigation
- [ ] Create horizontal scrolling rows
- [ ] Implement category sections
- [ ] Add search bar (UI only)
- [ ] Netflix-style hover effects

**Day 4: Continue Watching**
- [ ] Query incomplete watch sessions
- [ ] Build `ContinueWatching.tsx` component
- [ ] Show progress overlay on thumbnails
- [ ] Implement "Remove" functionality
- [ ] Sort by most recent

**Day 5: Mode Detection & Switching**
- [ ] Detect mode from profile age
- [ ] Build mode switcher (for testing)
- [ ] Ensure consistent navigation
- [ ] Test both modes thoroughly

**Acceptance Criteria:**
- Toddler mode is simple and icon-only
- Explorer mode has full navigation
- Continue watching shows correct videos
- Progress bars display accurately

### Week 3: Search & Discovery

**Days 1-2: Search Implementation**
- [ ] Build `/api/search` endpoint
- [ ] Integrate Meilisearch
- [ ] Implement `SearchBar.tsx`
- [ ] Create `SearchResults.tsx`
- [ ] Add filters (age, category, duration)

**Day 3: Category Browsing**
- [ ] Build `/api/categories` endpoint
- [ ] Create category pages
- [ ] Show video count per category
- [ ] Filter by profile age rating
- [ ] Add category icons

**Day 4: Video Cards & Grids**
- [ ] Build reusable `VideoCard.tsx`
- [ ] Create responsive grid layout
- [ ] Add hover states
- [ ] Show video metadata (duration, age rating)
- [ ] Optimize thumbnail loading

**Day 5: Search Polish**
- [ ] Add "No results" state
- [ ] Implement search suggestions
- [ ] Add recent searches (optional)
- [ ] Test search performance
- [ ] Add loading states

**Acceptance Criteria:**
- Search returns relevant results <1s
- Filters work correctly
- Categories display all videos
- UI is responsive on mobile

### Week 4: Favorites, Polish & Testing

**Days 1-2: Favorites Feature**
- [ ] Create favorites schema and migrations
- [ ] Build `/api/profiles/[id]/favorites` endpoints
- [ ] Implement heart icon toggle
- [ ] Create favorites page
- [ ] Add "Remove from favorites"

**Day 3: Navigation & Routing**
- [ ] Build child navigation component
- [ ] Implement back button behavior
- [ ] Add breadcrumbs (Explorer mode)
- [ ] Test deep linking
- [ ] Ensure proper redirects

**Day 4: Performance Optimization**
- [ ] Lazy load video thumbnails
- [ ] Implement infinite scroll (optional)
- [ ] Add skeleton loading states
- [ ] Optimize database queries
- [ ] Test with 100+ videos

**Day 5: End-to-End Testing**
- [ ] Write E2E tests for core flows
- [ ] Test on different screen sizes
- [ ] Verify touch targets on tablet
- [ ] Test with slow network
- [ ] Fix critical bugs

**Acceptance Criteria:**
- Favorites sync across sessions
- Navigation is intuitive
- Performance meets targets
- All E2E tests pass

## Testing Strategy

### Unit Tests
```typescript
// apps/web/src/lib/db/queries/__tests__/watch-sessions.test.ts
describe('Watch Sessions', () => {
  it('creates new session on start', async () => {
    const session = await startWatchSession(profileId, videoId);
    expect(session).toBeDefined();
    expect(session.profileId).toBe(profileId);
  });

  it('updates progress correctly', async () => {
    await updateWatchProgress(sessionId, 120, 60);
    const session = await getWatchSession(sessionId);
    expect(session.lastPosition).toBe(120);
  });

  it('marks session complete', async () => {
    await completeWatchSession(sessionId);
    const session = await getWatchSession(sessionId);
    expect(session.completed).toBe(true);
  });
});
```

### Integration Tests
```typescript
// apps/web/src/app/api/watch/__tests__/progress.test.ts
describe('POST /api/watch/[videoId]/progress', () => {
  it('requires valid session', async () => {
    const res = await POST({ videoId: 'v1', sessionId: 'invalid' });
    expect(res.status).toBe(404);
  });

  it('updates progress successfully', async () => {
    const session = await createTestSession();
    const res = await POST({
      videoId: 'v1',
      sessionId: session.id,
      position: 60,
      duration: 30
    });
    expect(res.status).toBe(200);
  });
});
```

### E2E Tests
```typescript
// tests/e2e/child-experience.spec.ts
import { test, expect } from '@playwright/test';

test('child can watch and resume video', async ({ page }) => {
  // Login as child
  await page.goto('/');
  await page.click('[data-testid="profile-eddie"]');

  // Select video
  await page.click('[data-testid="video-card"]:first-child');

  // Wait for player
  await expect(page.locator('video')).toBeVisible();

  // Play video
  await page.click('[data-testid="play-button"]');

  // Wait 5 seconds
  await page.waitForTimeout(5000);

  // Navigate away
  await page.goto('/');

  // Check continue watching
  const continueWatching = page.locator('[data-testid="continue-watching"]');
  await expect(continueWatching).toBeVisible();

  // Click to resume
  await continueWatching.click();

  // Verify video resumed (position > 0)
  const video = await page.locator('video').getAttribute('currentTime');
  expect(parseInt(video)).toBeGreaterThan(0);
});

test('toddler mode has large touch targets', async ({ page }) => {
  // Create toddler profile
  await createToddlerProfile();
  await page.goto('/');

  // Check button sizes
  const buttons = await page.locator('[data-testid^="category-"]').all();
  for (const button of buttons) {
    const box = await button.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(120);
    expect(box.height).toBeGreaterThanOrEqual(120);
  }
});
```

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Byte (TTFB) | <500ms | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse |
| First Input Delay (FID) | <100ms | Real User Monitoring |
| Cumulative Layout Shift (CLS) | <0.1 | Lighthouse |
| Video Load Time | <2s | Custom metric |
| Search Response Time | <1s | API monitoring |
| DB Query Time (p95) | <100ms | Prisma metrics |

## Accessibility Requirements

- All interactive elements keyboard navigable
- ARIA labels for screen readers
- Sufficient color contrast (WCAG AA)
- Focus indicators visible
- Touch targets minimum 88x88px (44x44 for Explorer mode)
- No seizure-inducing animations

## Known Challenges & Solutions

### Challenge 1: HLS Playback on Safari
**Problem:** Safari has specific HLS requirements
**Solution:** Use native HLS on Safari, HLS.js elsewhere
```typescript
const useNativeHLS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
```

### Challenge 2: Progress Tracking Accuracy
**Problem:** Network delays can cause position loss
**Solution:**
- Save progress every 10s locally (localStorage)
- Batch update to server every 30s
- Final save on unmount

### Challenge 3: Thumbnail Loading Performance
**Problem:** Loading 50+ thumbnails slows page
**Solution:**
- Lazy load images (IntersectionObserver)
- Use blur-up technique
- Optimize thumbnail sizes (200x150px)

### Challenge 4: Touch vs Click Detection
**Problem:** Different behavior on touch devices
**Solution:**
- Use `onPointerDown` instead of `onClick`
- Add active states for touch feedback
- Test on actual tablets

## Migration Guide

### Database Migration
```bash
# Create and run migration
cd apps/web
pnpm prisma migrate dev --name add-watch-sessions-and-favorites

# Seed test data
pnpm tsx prisma/seed-watch-sessions.ts
```

### Environment Variables
```env
# No new variables required for Phase 1
# Existing .env sufficient
```

### Breaking Changes
- None (new features only)

## Rollout Plan

### Week 1-2: Internal Testing
- Test with development team
- Fix critical bugs
- Gather feedback

### Week 3: Alpha Testing
- Test with 2-3 families
- Observe actual children using platform
- Iterate on UX issues

### Week 4: Beta Release
- Soft launch to early adopters
- Monitor error rates
- Collect feedback

## Success Metrics

### Quantitative
- 95% of child sessions are independent (no parent help)
- <1% error rate on video playback
- 90% of videos resume correctly
- Search returns results in <1s
- Zero critical bugs in production

### Qualitative
- Children can find and watch videos without frustration
- Parents report reduced need to help
- UI feels responsive and polished
- Touch interactions feel natural

## Dependencies

### External
- HLS.js for video playback
- Meilisearch for search (already configured)
- Existing database schema

### Internal
- Completed authentication system ✅
- Video import and storage ✅
- Child profile management ✅

## Deliverables

1. **Code**
   - Child home screens (Toddler + Explorer)
   - Video player with progress tracking
   - Search and category browsing
   - Favorites feature
   - All API endpoints

2. **Tests**
   - Unit tests for core logic
   - Integration tests for APIs
   - E2E tests for critical flows
   - Performance benchmarks

3. **Documentation**
   - Component documentation
   - API endpoint documentation
   - User guide for child features
   - Testing guide

4. **Database**
   - Migration scripts
   - Seed data
   - Query optimization

## Next Phase Preview

After Phase 1 completes, we move to **Phase 2: Add Intelligence** which includes:
- AI chat interface
- Safety filtering
- Conversation logging
- "Ask About This Video" feature

Phase 2 builds on Phase 1's video player by adding AI integration in the watch experience.

---

**Phase Owner:** Frontend Team
**Status:** 📋 Planning
**Start Date:** TBD
**Target Completion:** 4 weeks from start
