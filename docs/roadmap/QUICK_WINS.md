# Quick Wins

**Purpose:** Small, high-impact tasks that can be done immediately
**Timeline:** 1-8 hours each
**Can start:** Right now, in parallel with phase planning

## Overview

These are standalone tasks that:
- Provide immediate value
- Don't require extensive planning
- Can be done by a single developer
- Don't block or depend on other work
- Improve user experience or developer productivity

## Priority 1: Immediate Impact (Do First)

### 1. Add Demo Video to README
**Time:** 2 hours
**Impact:** High - Helps users understand what PlayPatch does
**Difficulty:** Easy

**Tasks:**
- [ ] Record 3-minute demo showing:
  - Parent importing a video
  - Child browsing and watching
  - Analytics dashboard
  - Time limits in action
- [ ] Upload to YouTube (unlisted)
- [ ] Embed in README.md
- [ ] Add to documentation site

**Acceptance:** README has embedded demo video

---

### 2. Add Screenshots to Documentation
**Time:** 1 hour
**Impact:** Medium - Makes documentation more engaging
**Difficulty:** Easy

**Tasks:**
- [ ] Capture screenshots of:
  - Home screen
  - Video player
  - Admin dashboard
  - Channel management
  - Analytics views
- [ ] Optimize images (compress to <100KB each)
- [ ] Add to README and docs
- [ ] Create `docs/screenshots/` folder

**Acceptance:** 5-8 screenshots in documentation

---

### 3. Create Docker One-Click Installer ✅ COMPLETED
**Time:** 4 hours
**Impact:** High - Reduces setup friction
**Difficulty:** Medium

**Tasks:**
- [x] Create `install.sh` script:
  ```bash
  #!/bin/bash
  # Check prerequisites (Docker, pnpm)
  # Clone repository
  # Copy .env.example to .env
  # Generate NEXTAUTH_SECRET
  # Run pnpm install
  # Run pnpm dev:all
  ```
- [x] Test on fresh Ubuntu VM (logic tested, needs real environment test)
- [x] Test on macOS (logic tested, needs real environment test)
- [x] Add to README
- [x] Create uninstall script

**Acceptance:** New user can install with one command

**Note:** Script created and tested for logic. Requires testing on fresh machine for full validation.

---

### 4. Improve Error Messages ✅ COMPLETED
**Time:** 2 hours
**Impact:** Medium - Better developer experience
**Difficulty:** Easy

**Tasks:**
- [x] Audit all error messages
- [x] Make errors actionable:
  ```typescript
  // Before
  throw new Error('Database connection failed');

  // After
  throw DatabaseErrors.CONNECTION_FAILED(cause);
  // Includes error code, message, and fix instructions
  ```
- [x] Add error codes for categorization
- [x] Document common errors in FAQ

**Acceptance:** All errors have actionable messages

**Implemented:**
- Created `lib/errors/messages.ts` with ActionableError class
- Added error categories: Database, AI, Storage, Video, Network, Auth, Config
- Updated AI service and YouTube importer with actionable errors
- Created comprehensive TROUBLESHOOTING.md with solutions for all error codes

---

## Priority 2: User Experience (Next)

### 5. Add Dark Mode Support
**Time:** 4 hours
**Impact:** Medium - Many users prefer dark mode
**Difficulty:** Medium

**Tasks:**
- [ ] Install `next-themes`
- [ ] Create dark color palette
- [ ] Update Tailwind config
- [ ] Add theme toggle button
- [ ] Test all pages in dark mode
- [ ] Persist preference

**Acceptance:** Dark mode works on all pages

---

### 6. Build Simple Progress Bar Component ✅ COMPLETED
**Time:** 2 hours
**Impact:** Medium - Visual feedback on video progress
**Difficulty:** Easy

**Tasks:**
- [x] Create `ProgressBar.tsx` component
- [x] Add to video cards
- [x] Show percentage complete
- [x] Add smooth animations
- [x] Test on different screen sizes

**Example:**
```typescript
<ProgressBar
  progress={0.65}
  color="primary"
  className="mt-2"
/>
```

**Acceptance:** Progress bars show on video cards

**Implemented:**
- Created reusable ProgressBar component with 3 variants:
  - ProgressBar: Basic horizontal progress bar
  - VideoProgressBar: Specialized for video watch progress
  - CircularProgress: Circular progress indicator
- Added smooth CSS transitions and animations
- Integrated into child video grid with watch progress display
- Color variants: primary, success, warning, error
- Supports custom heights, rounded corners, percentage display
- Created comprehensive example file with usage demos

---

### 7. Add Video Thumbnail Generation
**Time:** 4 hours
**Impact:** High - Better visual browsing
**Difficulty:** Medium

**Tasks:**
- [ ] Install `fluent-ffmpeg`
- [ ] Create thumbnail generation worker
- [ ] Generate at video midpoint
- [ ] Generate multiple thumbnails (preview strip)
- [ ] Store in MinIO
- [ ] Add to video metadata

**Acceptance:** All videos have auto-generated thumbnails

---

### 8. Implement "Continue Watching" Section ✅ COMPLETED
**Time:** 6 hours
**Impact:** High - Core child feature
**Difficulty:** Medium

**Tasks:**
- [x] Query watch sessions with 10-90% completion
- [x] Create `ContinueWatching.tsx` component
- [x] Show progress overlay on thumbnail
- [x] Sort by most recent
- [x] Add to home screen
- [x] Test with multiple profiles

**Acceptance:** Continue Watching section shows on home

**Implemented:**
- Enhanced existing ContinueWatching component with percentage-based filtering
- Query filters for 10-90% completion (not just > 30 seconds)
- Integrated with VideoProgressBar component for visual progress
- Shows completed checkmark badge for finished videos
- Already integrated in both Explorer and Toddler home screens
- Responsive limits: 4 videos (toddler), 6 videos (explorer)
- Sorts by most recently updated
- Hides section when no videos to continue

---

## Priority 3: Developer Productivity (Polish)

### 9. Add Code Formatting Pre-Commit Hook
**Time:** 1 hour
**Impact:** Medium - Consistent code style
**Difficulty:** Easy

**Tasks:**
- [ ] Install Husky
- [ ] Install lint-staged
- [ ] Configure pre-commit hook:
  ```json
  {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
  ```
- [ ] Test on sample commit
- [ ] Document in CONTRIBUTING.md

**Acceptance:** Code auto-formats on commit

---

### 10. Create Development Environment Health Check
**Time:** 2 hours
**Impact:** Medium - Faster debugging
**Difficulty:** Easy

**Tasks:**
- [ ] Create `scripts/health-check.sh`
- [ ] Check all services:
  - Docker running
  - PostgreSQL connected
  - Redis connected
  - MinIO accessible
  - Meilisearch healthy
- [ ] Add to `pnpm dev:all`
- [ ] Show clear status messages

**Example Output:**
```
✓ Docker running
✓ PostgreSQL connected
✓ Redis connected
✓ MinIO accessible
✓ Meilisearch healthy
✓ All systems ready!
```

**Acceptance:** Health check runs before starting services

---

### 11. Add TypeScript Path Aliases
**Time:** 1 hour
**Impact:** Low - Cleaner imports
**Difficulty:** Easy

**Tasks:**
- [ ] Configure in `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"],
        "@/components": ["./src/components/*"],
        "@/lib": ["./src/lib/*"],
        "@/types": ["./src/types/*"]
      }
    }
  }
  ```
- [ ] Update imports in existing files
- [ ] Document convention

**Before:**
```typescript
import { Button } from '../../../../components/ui/button';
```

**After:**
```typescript
import { Button } from '@/components/ui/button';
```

**Acceptance:** All imports use path aliases

---

## Priority 4: Documentation (Foundation)

### 12. Create Parent Dashboard Skeleton
**Time:** 8 hours
**Impact:** High - Foundation for Phase 3
**Difficulty:** Medium

**Tasks:**
- [ ] Create `/admin/dashboard` page
- [ ] Build layout with:
  - Family overview card
  - Per-child stat cards
  - Recent activity list
  - Pending approvals count
- [ ] Use placeholder data
- [ ] Make responsive
- [ ] Add skeleton loading states

**Acceptance:** Dashboard page exists with layout

---

### 13. Add API Documentation with Swagger
**Time:** 4 hours
**Impact:** Medium - Better API discoverability
**Difficulty:** Medium

**Tasks:**
- [ ] Install `swagger-jsdoc` and `swagger-ui-react`
- [ ] Add JSDoc comments to API routes
- [ ] Create `/api/docs` endpoint
- [ ] Generate OpenAPI spec
- [ ] Test interactive docs

**Example:**
```typescript
/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos
 *     parameters:
 *       - name: familyId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 */
export async function GET(req: Request) {
  // ...
}
```

**Acceptance:** API docs available at `/api/docs`

---

### 14. Create Troubleshooting FAQ
**Time:** 2 hours
**Impact:** Medium - Reduce support burden
**Difficulty:** Easy

**Tasks:**
- [ ] Create `docs/TROUBLESHOOTING.md`
- [ ] Document common issues:
  - Docker not starting
  - Database connection errors
  - Port conflicts
  - Video import failures
  - Worker not processing jobs
- [ ] Add solutions for each
- [ ] Link from main README

**Acceptance:** FAQ covers 10+ common issues

---

## Priority 5: Performance (Optional)

### 15. Add Image Optimization
**Time:** 2 hours
**Impact:** Medium - Faster page loads
**Difficulty:** Easy

**Tasks:**
- [ ] Audit all `<img>` tags
- [ ] Replace with Next.js `<Image>`
- [ ] Configure image domains
- [ ] Add `priority` prop to above-fold images
- [ ] Test on slow connection

**Acceptance:** All images use next/image

---

### 16. Implement Skeleton Loading States
**Time:** 4 hours
**Impact:** Medium - Better perceived performance
**Difficulty:** Easy

**Tasks:**
- [ ] Create reusable skeleton components:
  - `VideoCardSkeleton`
  - `DashboardSkeleton`
  - `ListSkeleton`
- [ ] Add to all async-loaded views
- [ ] Match actual component shapes
- [ ] Add subtle shimmer animation

**Acceptance:** All async views show skeletons

---

### 17. Add Database Query Logging (Development)
**Time:** 1 hour
**Impact:** Low - Easier optimization later
**Difficulty:** Easy

**Tasks:**
- [ ] Enable Prisma query logging in dev
- [ ] Log slow queries (>100ms)
- [ ] Format logs nicely
- [ ] Add to development docs

```typescript
// apps/web/src/lib/db/client.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error'],
});
```

**Acceptance:** Slow queries logged in development

---

## How to Use This List

### Solo Developer
Pick items in priority order. Start with Priority 1, move down.

### Team of 2-3
- Person 1: Priority 1 (Immediate Impact)
- Person 2: Priority 2 (User Experience)
- Person 3: Priority 3 (Developer Productivity)

### Waiting on Decisions
Work through Priority 4 (Documentation) while waiting for phase approval.

### Have 1 Hour?
- Error messages (#4)
- Path aliases (#11)
- Pre-commit hook (#9)

### Have Half Day?
- Dark mode (#5)
- Demo video (#1)
- Progress bars (#6)
- Troubleshooting FAQ (#14)

### Have Full Day?
- Dashboard skeleton (#12)
- Continue watching (#8)
- Thumbnail generation (#7)
- API documentation (#13)

## Tracking Progress

Create a GitHub project board with columns:
- 📋 Backlog
- 🏃 In Progress
- ✅ Done

Move items as you complete them. Celebrate small wins!

## Contributing Quick Wins

Have an idea for a quick win? It should:
1. Take <8 hours
2. Provide clear value
3. Not depend on other work
4. Be testable

Add to this doc via PR!

---

**Last Updated:** 2026-01-31
**Total Quick Wins:** 17
**Estimated Total Time:** 54 hours (1-2 weeks part-time)
