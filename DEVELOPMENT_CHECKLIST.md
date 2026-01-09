# SafeStream Kids - Development Checklist
## Implementation Tickets & Progress Tracking
### Version 1.0 | January 2026

---

## How to Use This Document

This checklist is organized as **Jira-style tickets** that can be used to track implementation progress. Each ticket includes:

- **ID**: Unique identifier (SSK-XXX)
- **Title**: Brief description
- **Epic**: Parent category
- **Priority**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Estimate**: Story points (1-13 scale)
- **Dependencies**: Required completed tickets
- **Acceptance Criteria**: Definition of done
- **PRD Reference**: Corresponding PRD section

### Status Key
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ⏸️ Blocked
- ❌ Cancelled

---

## Epic Overview

| Epic | ID Range | Description | Ticket Count |
|------|----------|-------------|--------------|
| **INFRA** | SSK-001 - SSK-020 | Infrastructure & DevOps | 12 |
| **AUTH** | SSK-021 - SSK-035 | Authentication & Users | 9 |
| **CONTENT** | SSK-036 - SSK-070 | Content Management | 15 |
| **CHILD-UI** | SSK-071 - SSK-120 | Child-Facing Interface (2 UI modes: Toddler, Explorer) | 19 |
| **ADMIN** | SSK-121 - SSK-155 | Admin Dashboard | 10 |
| **ANALYTICS** | SSK-156 - SSK-180 | Analytics & Reporting | 7 |
| **AI** | SSK-181 - SSK-210 | AI Integration | 12 |
| **ADVANCED** | SSK-236 - SSK-270 | Advanced Features | 10 |

*Note: UI modes simplified from 3 (Toddler/Explorer/Independent) to 2 (Toddler/Explorer)*

---

## Phase 1: Foundation (Weeks 1-4)

### Epic: INFRA - Infrastructure Setup

#### SSK-001: Project Scaffolding
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | None |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Initialize monorepo structure with Turborepo, pnpm workspaces, and base configuration.

**Acceptance Criteria:**
- [x] Monorepo structure created per TECHNICAL_DESIGN.md
- [x] pnpm workspace configured
- [x] Turborepo configured with build/dev/lint pipelines
- [x] TypeScript configured for all packages
- [x] ESLint + Prettier configured
- [x] .gitignore and .nvmrc in place
- [x] README with setup instructions

**Files to Create:**
```
/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── .nvmrc
└── README.md
```

---

#### SSK-002: Next.js Application Setup
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-001 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Set up Next.js 14+ application with App Router, Tailwind CSS, and base configuration.

**Acceptance Criteria:**
- [x] Next.js 14+ installed with App Router
- [x] Tailwind CSS configured
- [x] shadcn/ui initialized with base components
- [x] Environment variable handling set up
- [x] Basic layout structure created
- [x] Health check endpoint at /api/health

---

#### SSK-003: Docker Compose Development Environment
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-001 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Create Docker Compose configuration for local development with all required services.

**Acceptance Criteria:**
- [x] docker-compose.yml with all services
- [x] docker-compose.dev.yml with dev overrides
- [x] PostgreSQL 16 service configured
- [x] Redis 7 service configured
- [x] MinIO service configured with default buckets
- [x] Meilisearch service configured
- [x] .env.example with all required variables
- [x] Services health checks configured
- [x] `pnpm docker:dev` command works

---

#### SSK-004: Database Schema & Migrations
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-003 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Set up Prisma ORM with complete database schema as defined in TECHNICAL_DESIGN.md.

**Acceptance Criteria:**
- [x] Prisma installed and configured
- [x] Complete schema.prisma per technical design
- [x] All models created: Family, User, ChildProfile, Video, Channel, Collection, WatchSession, AIConversation, etc.
- [x] All enums defined
- [x] Indexes created for common queries
- [x] Initial migration created
- [x] `pnpm db:migrate` and `pnpm db:generate` commands work

---

#### SSK-005: MinIO/S3 Integration
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-003 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Create utility library for object storage operations.

**Acceptance Criteria:**
- [x] S3 client wrapper created (supports MinIO and AWS S3)
- [x] Bucket initialization on startup
- [x] Upload file function
- [x] Download file function
- [x] Generate presigned URL function
- [x] Delete file function
- [x] List files function
- [x] Environment-based configuration

---

#### SSK-006: Redis Integration
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 2 |
| Dependencies | SSK-003 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Set up Redis client for caching and session management.

**Acceptance Criteria:**
- [x] Redis client wrapper created (ioredis)
- [x] Connection pooling configured
- [x] Cache utility functions (get, set, del, setex)
- [x] Session storage utility
- [x] Rate limiting utility
- [x] Graceful connection handling

---

#### SSK-007: Meilisearch Integration
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-003 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Set up Meilisearch for video search functionality.

**Acceptance Criteria:**
- [x] Meilisearch client wrapper created
- [x] Index initialization script
- [x] Video index with searchable attributes
- [x] Filterable attributes (ageRating, categories, topics)
- [x] Index sync utility (add/update/delete documents)
- [x] Search utility function with filtering

---

#### SSK-008: Background Job Queue Setup
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-006 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Set up BullMQ for background job processing.

**Acceptance Criteria:**
- [x] BullMQ installed and configured
- [x] Queue definitions created (video-download, video-transcode, video-transcribe, channel-sync, cleanup)
- [x] Worker process entry point created
- [x] Job retry configuration
- [x] Job progress tracking
- [x] Job event logging
- [x] Admin queue dashboard (Bull Board) optional

---

#### SSK-009: Logging & Error Handling
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-002 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Implement structured logging and global error handling.

**Acceptance Criteria:**
- [x] Pino logger configured
- [x] Log levels based on environment
- [x] Sensitive data redaction
- [x] Request logging middleware
- [x] Global error handler
- [x] Error serialization for API responses
- [x] Development pretty printing

---

#### SSK-010: Docker Production Configuration
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-003 |
| Status | ⬜ |

**Description:**
Create Docker configuration for production deployment.

**Acceptance Criteria:**
- [ ] Dockerfile.web with multi-stage build
- [ ] Dockerfile.workers created
- [ ] docker-compose.prod.yml with Traefik
- [ ] SSL/TLS configuration with Let's Encrypt
- [ ] Production environment variables documented
- [ ] Health check endpoints work with Traefik

---

#### SSK-011: CI/CD Pipeline
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-010 |
| Status | ⬜ |

**Description:**
Set up GitHub Actions for CI/CD.

**Acceptance Criteria:**
- [ ] Lint job on all PRs
- [ ] Test job with service containers
- [ ] Build job validates production build
- [ ] Deploy to staging on develop branch
- [ ] Deploy to production on main branch (manual trigger)
- [ ] Docker image build and push

---

#### SSK-012: Backup & Restore Scripts
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 3 |
| Dependencies | SSK-010 |
| Status | ⬜ |

**Description:**
Create backup and restore scripts for data protection.

**Acceptance Criteria:**
- [ ] PostgreSQL backup script
- [ ] Redis backup script
- [ ] MinIO backup script (optional large files)
- [ ] Restore script for each
- [ ] Automated backup via cron
- [ ] Retention policy (keep last N backups)

---

### Epic: AUTH - Authentication & Authorization

#### SSK-021: NextAuth.js Setup
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-004 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Implement authentication using NextAuth.js v5.

**Acceptance Criteria:**
- [x] NextAuth.js v5 installed and configured
- [x] Credentials provider for email/password
- [x] Session stored in database
- [x] JWT configuration
- [x] Session callback to include user data
- [x] Auth middleware for protected routes
- [x] Type definitions for session

---

#### SSK-022: User Registration
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-021 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Implement admin user registration flow.

**Acceptance Criteria:**
- [x] POST /api/auth/register endpoint
- [x] Email validation (unique, format)
- [x] Password hashing with bcrypt (cost 12)
- [x] Password strength validation
- [x] Family creation on first user
- [x] Confirmation email (optional first)
- [x] Registration page UI

---

#### SSK-023: User Login
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-021 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Implement login functionality.

**Acceptance Criteria:**
- [x] Login page UI
- [x] Email + password form validation
- [x] Login API integration
- [x] Error handling (invalid credentials)
- [x] Rate limiting on login attempts
- [x] Redirect to dashboard on success
- [x] "Remember me" option

---

#### SSK-024: Child Profile Management
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-023 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
CRUD operations for child profiles.

**Acceptance Criteria:**
- [x] Create child profile (name, birthDate, avatar)
- [x] Read child profiles for family
- [x] Update child profile
- [x] Delete child profile
- [x] Age auto-calculation from birthDate
- [x] UI mode auto-suggestion based on age
- [x] Admin UI for profile management

---

#### SSK-025: Child Profile Selection
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-024 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Profile selection screen for switching to child mode.

**Acceptance Criteria:**
- [x] Profile selection screen with avatars
- [x] Optional PIN entry for profiles
- [x] Child session creation
- [x] Cookie/session management for child context
- [x] UI transition to child interface
- [x] "Who's watching?" Netflix-style UI

---

#### SSK-026: Child Profile Settings
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-024 |
| Status | ⬜ |

**Description:**
Detailed settings for each child profile.

**Acceptance Criteria:**
- [ ] Age rating limit setting
- [ ] UI mode selection (toddler/explorer/independent)
- [ ] AI enabled/disabled toggle
- [ ] AI voice enabled toggle
- [ ] Theme selection
- [ ] Allowed categories selection
- [ ] Settings UI in admin dashboard

---

#### SSK-027: Time Limits Configuration
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-026 |
| Status | ⬜ |

**Description:**
Implement time limit settings per child profile.

**Acceptance Criteria:**
- [ ] Weekday time limit setting
- [ ] Weekend time limit setting
- [ ] Allowed hours range (start/end time)
- [ ] Break reminder interval
- [ ] Warning threshold before limit
- [ ] Settings stored in child profile
- [ ] Time limits UI in admin

PRD Reference: Section 5.5

---

#### SSK-028: Session Management
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-025 |
| Status | ⬜ |

**Description:**
Manage active sessions and remote control.

**Acceptance Criteria:**
- [ ] List active sessions (admin view)
- [ ] Session device info tracking
- [ ] Remote session termination
- [ ] Session timeout configuration
- [ ] Auto-logout on inactivity

---

#### SSK-029: Role-Based Access Control
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-021 |
| Status | ⬜ |

**Description:**
Implement RBAC for API routes.

**Acceptance Criteria:**
- [ ] ADMIN role has full access
- [ ] VIEWER role has limited access
- [ ] CHILD context has child-only access
- [ ] Middleware for role checking
- [ ] Route protection decorators/HOCs
- [ ] 403 responses for unauthorized

---

### Epic: CONTENT - Content Management

#### SSK-036: Video Model & CRUD
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-004 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Basic video CRUD operations.

**Acceptance Criteria:**
- [x] Create video record
- [x] Read video with all relations
- [x] Update video metadata
- [x] Delete video (soft delete option)
- [x] List videos with pagination
- [x] Filter videos by status, age, category

---

#### SSK-037: YouTube Video Import
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-005, SSK-008 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Import videos from YouTube URLs.

**Acceptance Criteria:**
- [x] POST /api/admin/videos/import endpoint
- [x] URL validation (YouTube supported)
- [x] Metadata extraction via yt-dlp
- [x] Video download job queued
- [x] Thumbnail download
- [x] Progress tracking
- [x] Error handling for private/unavailable videos
- [x] Import status in admin UI

---

#### SSK-038: Video Download Worker
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-037 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Background worker for video downloads.

**Acceptance Criteria:**
- [x] yt-dlp integration for download
- [x] Quality selection (configurable)
- [x] Download to temp directory
- [x] Upload to MinIO on completion
- [x] Update video record status
- [x] Retry logic on failure
- [x] Cleanup temp files

---

#### SSK-039: Video Transcoding Worker
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-038 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Transcode videos to HLS format.

**Acceptance Criteria:**
- [x] FFmpeg integration
- [x] Convert to HLS format
- [x] Multiple quality variants (360p, 480p, 720p)
- [x] Generate master playlist
- [x] Upload HLS segments to MinIO
- [x] Update video hlsPath
- [x] Progress tracking

---

#### SSK-040: Thumbnail Generation
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-038 |
| Status | ⬜ |

**Description:**
Generate thumbnails for videos.

**Acceptance Criteria:**
- [ ] Extract frame from video (FFmpeg)
- [ ] Multiple sizes (small, medium, large)
- [ ] WebP format for efficiency
- [ ] Upload to MinIO
- [ ] Fallback to source thumbnail if available

---

#### SSK-041: Video Approval Queue
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-036 |
| Status | ✅ |
| Completed | January 2026 |

**Description:**
Approval workflow for imported videos.

**Acceptance Criteria:**
- [x] List pending videos
- [x] Preview video before approval
- [x] Approve with age rating + categories
- [x] Reject with reason
- [x] Bulk actions (approve/reject multiple)
- [x] Filter by pending status
- [x] Admin UI for queue

PRD Reference: Section 5.1.1

---

#### SSK-042: Video Metadata Editing
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-036 |
| Status | ⬜ |

**Description:**
Edit video metadata after import.

**Acceptance Criteria:**
- [ ] Edit title
- [ ] Edit description
- [ ] Change age rating
- [ ] Add/remove categories
- [ ] Add/remove topics
- [ ] Add admin notes
- [ ] Replace thumbnail
- [ ] Edit form UI

---

#### SSK-043: Channel Subscription
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-037 |
| Status | ⬜ |

**Description:**
Subscribe to YouTube channels.

**Acceptance Criteria:**
- [ ] Add channel by URL/ID
- [ ] Fetch channel metadata
- [ ] Set sync mode (auto-approve, review, selective)
- [ ] Set sync frequency
- [ ] Set default age rating
- [ ] Set default categories
- [ ] Channel list UI

PRD Reference: Section 5.1.2

---

#### SSK-044: Channel Sync Worker
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-043 |
| Status | ⬜ |

**Description:**
Sync new videos from subscribed channels.

**Acceptance Criteria:**
- [ ] Fetch new videos from channel
- [ ] Check if already imported
- [ ] Apply sync mode rules
- [ ] Queue video imports
- [ ] Update lastSyncAt
- [ ] Schedule next sync
- [ ] Manual sync trigger

---

#### SSK-045: Collections CRUD
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-036 |
| Status | ⬜ |

**Description:**
Parent-created collections/playlists.

**Acceptance Criteria:**
- [ ] Create collection (name, description, thumbnail)
- [ ] Add videos to collection
- [ ] Remove videos from collection
- [ ] Reorder videos
- [ ] Set visibility (all/specific ages/specific children)
- [ ] Delete collection
- [ ] Collection management UI

PRD Reference: Section 5.1.3

---

#### SSK-046: Smart Playlists
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-045 |
| Status | ⬜ |

**Description:**
Auto-updating playlists based on rules.

**Acceptance Criteria:**
- [ ] Define rules (category, topic, duration, etc.)
- [ ] Auto-populate based on rules
- [ ] Re-evaluate on video add/update
- [ ] Preset smart playlists (Recently Added, Not Watched)
- [ ] Smart playlist UI

---

#### SSK-047: Video Transcription Worker
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-038 |
| Status | ⬜ |

**Description:**
Generate transcripts using Whisper.

**Acceptance Criteria:**
- [ ] Whisper integration (local or API)
- [ ] Extract audio from video
- [ ] Generate transcript with timestamps
- [ ] Store transcript in database
- [ ] Update isTranscribed flag
- [ ] Language detection
- [ ] Configurable model size

---

#### SSK-048: Video Search Indexing
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-007, SSK-036 |
| Status | ⬜ |

**Description:**
Index videos in Meilisearch.

**Acceptance Criteria:**
- [ ] Index on video approval
- [ ] Update index on video edit
- [ ] Remove from index on delete
- [ ] Searchable: title, description, topics, transcript
- [ ] Filterable: ageRating, categories
- [ ] Full reindex script

---

#### SSK-049: Bulk Video Import
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-037 |
| Status | ⬜ |

**Description:**
Import multiple videos at once.

**Acceptance Criteria:**
- [ ] Import from playlist URL
- [ ] CSV import (URLs list)
- [ ] Progress tracking for batch
- [ ] Partial failure handling
- [ ] Bulk import UI

---

#### SSK-050: Direct Video Upload
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-005 |
| Status | ⬜ |

**Description:**
Upload videos directly without external source.

**Acceptance Criteria:**
- [ ] Multipart upload endpoint
- [ ] Large file support (chunked)
- [ ] Video validation (format, size)
- [ ] Trigger transcode on upload
- [ ] Upload progress UI
- [ ] Drag-and-drop support

---

## Phase 2: Child Experience (Weeks 5-8)

### Epic: CHILD-UI - Child-Facing Interface

#### SSK-071: Child Layout & Navigation
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-025 |
| Status | ⬜ |

**Description:**
Base layout for child interface with navigation.

**Acceptance Criteria:**
- [ ] Child layout wrapper component
- [ ] Profile avatar in header
- [ ] Navigation based on UI mode
- [ ] Settings access (limited)
- [ ] Exit to profile selection
- [ ] Responsive design

---

#### SSK-072: Toddler Mode Home Screen
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-071 |
| Status | ⬜ |

**Description:**
Home screen optimized for ages 2-4.

**Acceptance Criteria:**
- [ ] Large, colorful category tiles
- [ ] Icon-only navigation (no text required)
- [ ] Extra large touch targets (88x88px min)
- [ ] Maximum 6 categories visible
- [ ] No scrolling on main screen
- [ ] Bright, high-contrast colors
- [ ] Sound feedback on tap
- [ ] Voice activation button

PRD Reference: Section 5.2.1

---

#### SSK-073: Explorer Mode Home Screen
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-071 |
| Status | ⬜ |

**Description:**
Home screen for ages 5-12 (combined Explorer mode).

**Acceptance Criteria:**
- [ ] Sidebar navigation with categories
- [ ] Continue watching row with progress bars
- [ ] Category rows (horizontal scroll)
- [ ] Search bar in header with full text search
- [ ] Voice search with visual feedback
- [ ] Favorites and playlists quick access
- [ ] Watch history access
- [ ] AI chat integration button
- [ ] Keyboard navigation support
- [ ] Gentle animations
- [ ] Responsive to different age capabilities within range

PRD Reference: Section 5.2.1

---

#### SSK-075: Video Player Component
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-039 |
| Status | ⬜ |

**Description:**
Custom video player for HLS streaming.

**Acceptance Criteria:**
- [ ] HLS.js or Video.js integration
- [ ] Play/pause, seek, volume controls
- [ ] Fullscreen support
- [ ] Progress bar with preview thumbnails
- [ ] Resume from last position
- [ ] Playback speed control (0.5x - 1.5x)
- [ ] Responsive sizing
- [ ] Keyboard shortcuts (independent mode)
- [ ] Touch gestures (mobile)

PRD Reference: Section 5.2.2

---

#### SSK-076: Captions/Subtitles Support
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-075, SSK-047 |
| Status | ⬜ |

**Description:**
Display captions from transcripts.

**Acceptance Criteria:**
- [ ] Generate VTT from transcript
- [ ] Caption toggle in player
- [ ] Caption styling options
- [ ] Position options (top/bottom)

---

#### SSK-077: Watch Session Tracking
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-075 |
| Status | ⬜ |

**Description:**
Track viewing sessions for analytics.

**Acceptance Criteria:**
- [ ] Create session on video start
- [ ] Heartbeat every 30 seconds (position update)
- [ ] End session on video close
- [ ] Track completed status
- [ ] Device info capture
- [ ] Handle browser close gracefully

---

#### SSK-078: Continue Watching
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-077 |
| Status | ⬜ |

**Description:**
Resume videos from last position.

**Acceptance Criteria:**
- [ ] Store last position per video per child
- [ ] Show progress bar on thumbnails
- [ ] "Continue Watching" section on home
- [ ] Resume prompt on video open
- [ ] Clear progress option

---

#### SSK-079: Video Detail Page
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-075 |
| Status | ⬜ |

**Description:**
Page showing video player and metadata.

**Acceptance Criteria:**
- [ ] Video player (full width or theater mode)
- [ ] Video title and metadata
- [ ] Age rating badge
- [ ] Duration display
- [ ] Categories/topics display
- [ ] Favorite button
- [ ] Add to playlist button
- [ ] "Ask Questions" button (AI)
- [ ] Related videos section

---

#### SSK-080: Related Videos Algorithm
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-079 |
| Status | ⬜ |

**Description:**
Recommend related videos from curated library.

**Acceptance Criteria:**
- [ ] Same channel (35% weight)
- [ ] Same topics (30% weight)
- [ ] Same category (20% weight)
- [ ] Viewing patterns (10% weight)
- [ ] Parent-boosted content bonus
- [ ] Exclude videos above child's age rating
- [ ] Exclude recently watched

PRD Reference: Section 5.2.3

---

#### SSK-081: Video Search
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-048 |
| Status | ⬜ |

**Description:**
Search functionality for children.

**Acceptance Criteria:**
- [ ] Text search input
- [ ] Search results page
- [ ] Filter by category
- [ ] Filter by duration
- [ ] Typo-tolerant search
- [ ] Age-filtered results
- [ ] Voice search (microphone button)

---

#### SSK-082: Voice Search
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-081 |
| Status | ⬜ |

**Description:**
Voice input for search queries.

**Acceptance Criteria:**
- [ ] Web Speech API integration
- [ ] Microphone permission handling
- [ ] Visual feedback during recording
- [ ] Transcript display
- [ ] Auto-search on recognition
- [ ] Fallback for unsupported browsers

---

#### SSK-083: Favorites System
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-036 |
| Status | ⬜ |

**Description:**
Allow children to favorite videos.

**Acceptance Criteria:**
- [ ] Heart button on video thumbnails
- [ ] Heart button on video detail page
- [ ] Toggle favorite (add/remove)
- [ ] Favorites page/section
- [ ] Animation on favorite

---

#### SSK-084: Child Playlists
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-083 |
| Status | ⬜ |

**Description:**
Children can create their own playlists.

**Acceptance Criteria:**
- [ ] Create playlist (name only)
- [ ] Add video to playlist
- [ ] Remove video from playlist
- [ ] View playlist
- [ ] Play playlist (sequential)
- [ ] Delete playlist
- [ ] Simple emoji icons for playlists

PRD Reference: Section 5.2.4

---

#### SSK-085: Time Limit Enforcement
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-027, SSK-077 |
| Status | ⬜ |

**Description:**
Enforce watch time limits during viewing.

**Acceptance Criteria:**
- [ ] Check remaining time on session start
- [ ] Display time remaining in player (optional)
- [ ] Gentle warning popup at threshold
- [ ] Block playback when limit reached
- [ ] "Time's Up" screen with activity suggestions
- [ ] Allow finishing current video option
- [ ] Parent PIN override option

PRD Reference: Section 5.5.2

---

#### SSK-086: Break Reminders
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-085 |
| Status | ⬜ |

**Description:**
Remind children to take breaks.

**Acceptance Criteria:**
- [ ] Configurable interval (per profile)
- [ ] Gentle popup reminder
- [ ] Movement activity suggestion
- [ ] Optional: pause until acknowledged
- [ ] Skip option (limited skips)

---

#### SSK-087: Bedtime Mode
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 3 |
| Dependencies | SSK-085 |
| Status | ⬜ |

**Description:**
Special mode for evening viewing.

**Acceptance Criteria:**
- [ ] Auto-activate at configured time
- [ ] Dim screen by configurable %
- [ ] Only show calm/bedtime collection
- [ ] Disable autoplay
- [ ] Warmer color temperature

PRD Reference: Section 5.5.1

---

#### SSK-088: Theme Customization
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-071 |
| Status | ⬜ |

**Description:**
Allow children to customize their theme.

**Acceptance Criteria:**
- [ ] Theme selection (Space, Ocean, Safari, Fantasy, etc.)
- [ ] Theme colors applied to UI
- [ ] Theme-appropriate icons
- [ ] Avatar selection
- [ ] Custom name display option
- [ ] Settings page for customization

PRD Reference: Section 7.7

---

#### SSK-089: Auto-Play Next
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-075, SSK-080 |
| Status | ⬜ |

**Description:**
Auto-play next video in series/related.

**Acceptance Criteria:**
- [ ] Show "Up Next" preview
- [ ] Countdown timer (10 seconds)
- [ ] Cancel button
- [ ] Disable in bedtime mode
- [ ] Parent can disable globally

---

#### SSK-090: Browse by Category
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-071 |
| Status | ⬜ |

**Description:**
Browse videos by category.

**Acceptance Criteria:**
- [ ] Category list page
- [ ] Category detail page with videos
- [ ] Subcategories support
- [ ] Age-filtered display
- [ ] Pagination/infinite scroll

---

## Phase 3: Admin Dashboard (Weeks 9-12)

### Epic: ADMIN - Admin Dashboard

#### SSK-121: Admin Layout & Navigation
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-023 |
| Status | ⬜ |

**Description:**
Base layout for admin dashboard.

**Acceptance Criteria:**
- [ ] Sidebar navigation
- [ ] Header with user menu
- [ ] Breadcrumb navigation
- [ ] Responsive design (mobile)
- [ ] Dark/light mode toggle

---

#### SSK-122: Admin Dashboard Overview
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-121 |
| Status | ⬜ |

**Description:**
Main dashboard with family overview.

**Acceptance Criteria:**
- [ ] Total watch time (week)
- [ ] Per-child summary cards
- [ ] Category breakdown chart
- [ ] Recent activity feed
- [ ] Pending approvals count
- [ ] Alerts count
- [ ] Quick actions

PRD Reference: Section 5.4.1

---

#### SSK-123: Content Library Page
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-041 |
| Status | ⬜ |

**Description:**
Browse and manage all videos.

**Acceptance Criteria:**
- [ ] Video grid/list view toggle
- [ ] Filter by status, age, category
- [ ] Search videos
- [ ] Sort options (date, title, duration)
- [ ] Bulk selection
- [ ] Bulk actions (approve, delete)
- [ ] Pagination

---

#### SSK-124: Video Edit Modal/Page
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-042 |
| Status | ⬜ |

**Description:**
Edit video metadata in admin.

**Acceptance Criteria:**
- [ ] Edit form with all fields
- [ ] Thumbnail preview/change
- [ ] Video preview player
- [ ] Save/cancel actions
- [ ] Delete option
- [ ] Validation feedback

---

#### SSK-125: Approval Queue Page
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-041 |
| Status | ⬜ |

**Description:**
Review and approve pending videos.

**Acceptance Criteria:**
- [ ] List of pending videos
- [ ] Video preview
- [ ] Approve with settings
- [ ] Reject with reason
- [ ] Skip to next
- [ ] Bulk approve (trusted channels)
- [ ] Queue count in sidebar

---

#### SSK-126: Channel Management Page
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-043 |
| Status | ⬜ |

**Description:**
Manage channel subscriptions.

**Acceptance Criteria:**
- [ ] Add channel form
- [ ] Channel list with stats
- [ ] Edit channel settings
- [ ] Sync mode configuration
- [ ] Manual sync button
- [ ] Last sync status
- [ ] Unsubscribe option

---

#### SSK-127: Collections Management
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-045 |
| Status | ⬜ |

**Description:**
Create and manage collections.

**Acceptance Criteria:**
- [ ] Collection list
- [ ] Create collection form
- [ ] Edit collection
- [ ] Add/remove videos (drag-drop)
- [ ] Reorder videos
- [ ] Set visibility
- [ ] Delete collection

---

#### SSK-128: Child Profiles Admin
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-024, SSK-026 |
| Status | ⬜ |

**Description:**
Manage child profiles in admin.

**Acceptance Criteria:**
- [ ] Profile cards for each child
- [ ] Create new profile
- [ ] Edit profile settings
- [ ] Delete profile
- [ ] View child's activity summary

---

#### SSK-129: Time Limits Settings UI
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-027 |
| Status | ⬜ |

**Description:**
Configure time limits per child.

**Acceptance Criteria:**
- [ ] Weekday/weekend toggle
- [ ] Time picker for limits
- [ ] Allowed hours range
- [ ] Break reminder settings
- [ ] Bedtime mode settings
- [ ] Save/apply to profile

---

#### SSK-130: Import Queue Status
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-037 |
| Status | ⬜ |

**Description:**
Monitor video import progress.

**Acceptance Criteria:**
- [ ] Active imports list
- [ ] Progress bars
- [ ] Status indicators
- [ ] Error details
- [ ] Retry failed imports
- [ ] Cancel imports

---

## Phase 4: Analytics (Weeks 13-16)

### Epic: ANALYTICS - Analytics & Reporting

#### SSK-156: Watch Time Analytics
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-077 |
| Status | ⬜ |

**Description:**
Calculate and display watch time metrics.

**Acceptance Criteria:**
- [ ] Total watch time (day/week/month)
- [ ] Watch time per child
- [ ] Watch time trend (vs previous period)
- [ ] Watch time by day of week
- [ ] Watch time by hour

---

#### SSK-157: Category Analytics
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-156 |
| Status | ⬜ |

**Description:**
Breakdown of viewing by category.

**Acceptance Criteria:**
- [ ] Category distribution pie/bar chart
- [ ] Category trends over time
- [ ] Per-child category breakdown
- [ ] Top categories ranking

---

#### SSK-158: Child Analytics Dashboard
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-156, SSK-157 |
| Status | ⬜ |

**Description:**
Detailed analytics per child.

**Acceptance Criteria:**
- [ ] Engagement summary
- [ ] Viewing patterns heatmap
- [ ] Interest scores by topic
- [ ] Top watched videos
- [ ] Insights (AI-generated suggestions)
- [ ] Date range selector

PRD Reference: Section 5.4.2

---

#### SSK-159: Interest Detection
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-158 |
| Status | ⬜ |

**Description:**
Identify and track child's interests.

**Acceptance Criteria:**
- [ ] Calculate interest scores from viewing
- [ ] Track emerging interests (new topics)
- [ ] Interest trend (rising/falling)
- [ ] Interest-based content suggestions
- [ ] Interest display in child analytics

---

#### SSK-160: Watch History Page
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 3 |
| Dependencies | SSK-077 |
| Status | ⬜ |

**Description:**
View complete watch history for child.

**Acceptance Criteria:**
- [ ] Chronological list of watched videos
- [ ] Date/time of viewing
- [ ] Duration watched
- [ ] Completed indicator
- [ ] Filter by date range
- [ ] Export option

---

#### SSK-161: Weekly Digest Report
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-158 |
| Status | ⬜ |

**Description:**
Generate weekly report for parents.

**Acceptance Criteria:**
- [ ] Aggregate weekly data
- [ ] Per-child summary
- [ ] Top interests
- [ ] Notable questions (AI)
- [ ] Content suggestions
- [ ] HTML email template
- [ ] Send via configured email

PRD Reference: Section 5.4.4

---

#### SSK-162: Analytics Export
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 3 |
| Dependencies | SSK-158 |
| Status | ⬜ |

**Description:**
Export analytics data.

**Acceptance Criteria:**
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Date range selection
- [ ] Per-child or family
- [ ] GDPR-compliant full export

---

## Phase 5: AI Integration (Weeks 17-20)

### Epic: AI - AI Integration

#### SSK-181: Ollama Integration
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-003 |
| Status | ⬜ |

**Description:**
Integrate Ollama for local LLM inference.

**Acceptance Criteria:**
- [ ] Ollama container in Docker Compose
- [ ] API client for Ollama
- [ ] Model pulling script
- [ ] Fallback configuration (OpenAI)
- [ ] Response streaming support

---

#### SSK-182: AI Input Filtering
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-181 |
| Status | ⬜ |

**Description:**
Filter child input before sending to LLM.

**Acceptance Criteria:**
- [ ] Profanity filter
- [ ] PII detection
- [ ] Harmful content detection
- [ ] Topic boundary checking
- [ ] Blocked input response
- [ ] Logging of filtered inputs

PRD Reference: Section 5.3.2

---

#### SSK-183: AI Output Filtering
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-181 |
| Status | ⬜ |

**Description:**
Filter LLM output before showing to child.

**Acceptance Criteria:**
- [ ] Inappropriate content detection
- [ ] External link removal
- [ ] Length enforcement (age-based)
- [ ] Regeneration on filter trigger
- [ ] Logging of filtered outputs

---

#### SSK-184: System Prompt Builder
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-181 |
| Status | ⬜ |

**Description:**
Construct age-appropriate system prompts.

**Acceptance Criteria:**
- [ ] Template-based prompt construction
- [ ] Child name/age injection
- [ ] Video context injection
- [ ] Topic boundaries
- [ ] Response length limits
- [ ] Safety guidelines

PRD Reference: Section 5.3.3

---

#### SSK-185: AI Chat API
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-182, SSK-183, SSK-184 |
| Status | ⬜ |

**Description:**
Chat endpoint for child AI interactions.

**Acceptance Criteria:**
- [ ] POST /api/child/ai/chat
- [ ] Conversation ID tracking
- [ ] Message storage
- [ ] Rate limiting
- [ ] Streaming response option
- [ ] Error handling

---

#### SSK-186: AI Chat UI (Toddler)
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-185 |
| Status | ⬜ |

**Description:**
Simplified AI chat for toddlers.

**Acceptance Criteria:**
- [ ] Voice input only
- [ ] Voice response (TTS)
- [ ] Single Q&A (no conversation)
- [ ] Large, friendly UI
- [ ] Character avatar

---

#### SSK-187: AI Chat UI (Explorer)
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 8 |
| Dependencies | SSK-185 |
| Status | ⬜ |

**Description:**
Chat interface for Explorer mode (ages 5-12).

**Acceptance Criteria:**
- [ ] Full chat interface with history
- [ ] Text + voice input
- [ ] Multi-turn conversations
- [ ] Chat bubbles with friendly design
- [ ] Suggested questions
- [ ] Follow-up suggestions
- [ ] "Learn more" and "Dive deeper" options
- [ ] Related video links
- [ ] Response complexity adapts to child's age

PRD Reference: Section 5.3.4

---

#### SSK-189: Conversation Logging
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 3 |
| Dependencies | SSK-185 |
| Status | ⬜ |

**Description:**
Store all AI conversations.

**Acceptance Criteria:**
- [ ] Store conversation record
- [ ] Store all messages
- [ ] Track filtered content
- [ ] Extract topics discussed
- [ ] Index for admin search

---

#### SSK-190: AI Alert System
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-189 |
| Status | ⬜ |

**Description:**
Alert parents to concerning AI interactions.

**Acceptance Criteria:**
- [ ] Flag types defined
- [ ] Real-time flag creation
- [ ] Alert display in admin
- [ ] Email notification option
- [ ] Flag review UI

PRD Reference: Section 5.3.5

---

#### SSK-191: AI Conversation Logs UI
| Field | Value |
|-------|-------|
| Priority | P0 |
| Estimate | 5 |
| Dependencies | SSK-189 |
| Status | ⬜ |

**Description:**
Admin view of AI conversations.

**Acceptance Criteria:**
- [ ] List of conversations
- [ ] Filter by child
- [ ] Filter by flagged
- [ ] View full conversation
- [ ] Topics summary
- [ ] Export option

PRD Reference: Section 5.4.3

---

#### SSK-192: Question Themes Analysis
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-189 |
| Status | ⬜ |

**Description:**
Analyze patterns in child questions.

**Acceptance Criteria:**
- [ ] Extract question types
- [ ] Count by theme
- [ ] Display in analytics
- [ ] Trend over time

---

#### SSK-193: Curiosity Sparks
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-181 |
| Status | ⬜ |

**Description:**
Generate discussion prompts after videos.

**Acceptance Criteria:**
- [ ] Generate prompts from video content
- [ ] Age-appropriate prompts
- [ ] Display after video ends
- [ ] Save to journal option
- [ ] Ask AI about prompt

PRD Reference: Section 7.4

---

## Phase 6: Advanced Features (Weeks 21-28)

### Epic: ADVANCED - Advanced Features

#### SSK-236: Adventure Mode - Learning Paths
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 13 |
| Dependencies | SSK-090 |
| Status | ⬜ |

**Description:**
Gamified learning paths for children.

**Acceptance Criteria:**
- [ ] Path data model
- [ ] Path creation UI (admin)
- [ ] Path progress tracking
- [ ] Milestone celebrations
- [ ] Badge/reward system
- [ ] Path discovery UI (child)
- [ ] Path progress UI

PRD Reference: Section 7.1

---

#### SSK-237: Video Journals
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 8 |
| Dependencies | SSK-079 |
| Status | ⬜ |

**Description:**
Children record reflections on videos.

**Acceptance Criteria:**
- [ ] Voice note recording
- [ ] Voice note transcription
- [ ] Simple drawing canvas
- [ ] Star rating
- [ ] Journal list view
- [ ] Parent viewable

PRD Reference: Section 7.2

---

#### SSK-238: Content Request System
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-159 |
| Status | ⬜ |

**Description:**
Children can request content types.

**Acceptance Criteria:**
- [ ] Simple request form
- [ ] Parent notification
- [ ] Request list in admin
- [ ] AI content suggestions
- [ ] Mark as fulfilled

PRD Reference: Section 7.5

---

#### SSK-239: Watch Together Mode
| Field | Value |
|-------|-------|
| Priority | P3 |
| Estimate | 13 |
| Dependencies | SSK-075 |
| Status | ⬜ |

**Description:**
Synchronized remote viewing.

**Acceptance Criteria:**
- [ ] Create watch session
- [ ] Share link/code
- [ ] Synchronized playback
- [ ] Basic video chat (optional)
- [ ] Shared reactions

PRD Reference: Section 7.3

---

#### SSK-240: Healthy Habits Integration
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-086 |
| Status | ⬜ |

**Description:**
Movement breaks and activity suggestions.

**Acceptance Criteria:**
- [ ] Movement video collection
- [ ] Break screen with video
- [ ] Activity suggestions
- [ ] Positive messaging

PRD Reference: Section 7.6

---

#### SSK-241: PWA Support
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 5 |
| Dependencies | SSK-002 |
| Status | ⬜ |

**Description:**
Progressive Web App configuration.

**Acceptance Criteria:**
- [ ] Web app manifest
- [ ] Service worker
- [ ] Offline support (cached videos)
- [ ] Install prompt
- [ ] Push notifications (optional)

---

#### SSK-242: Mobile Responsiveness
| Field | Value |
|-------|-------|
| Priority | P1 |
| Estimate | 8 |
| Dependencies | SSK-071 |
| Status | ⬜ |

**Description:**
Optimize for tablets and phones.

**Acceptance Criteria:**
- [ ] Touch-friendly interactions
- [ ] Responsive layouts
- [ ] Landscape/portrait support
- [ ] Tablet-optimized views
- [ ] Phone-optimized views

---

#### SSK-243: Parent Mobile View
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 5 |
| Dependencies | SSK-121 |
| Status | ⬜ |

**Description:**
Mobile-friendly admin dashboard.

**Acceptance Criteria:**
- [ ] Responsive admin layout
- [ ] Quick stats on mobile
- [ ] Approval queue on mobile
- [ ] Notifications on mobile

---

#### SSK-244: Cloudflare Tunnel Support
| Field | Value |
|-------|-------|
| Priority | P2 |
| Estimate | 3 |
| Dependencies | SSK-010 |
| Status | ⬜ |

**Description:**
Deploy using Cloudflare Tunnel.

**Acceptance Criteria:**
- [ ] cloudflared container config
- [ ] Tunnel configuration docs
- [ ] DNS setup documentation
- [ ] Zero Trust setup guide

---

#### SSK-245: Multi-Language Support
| Field | Value |
|-------|-------|
| Priority | P3 |
| Estimate | 8 |
| Dependencies | SSK-002 |
| Status | ⬜ |

**Description:**
Internationalization support.

**Acceptance Criteria:**
- [ ] i18n library setup
- [ ] English strings extracted
- [ ] Language selection
- [ ] RTL support (if needed)

---

---

## Summary Statistics

| Phase | Epic | Total Tickets | Total Points | Core Features |
|-------|------|---------------|--------------|---------------|
| 1 | INFRA | 12 | 47 | Project setup, Docker, DB |
| 1 | AUTH | 9 | 35 | Login, profiles, permissions |
| 1 | CONTENT | 15 | 67 | Import, transcode, approve |
| 2 | CHILD-UI | 19 | 90 | Player, search, time limits |
| 3 | ADMIN | 10 | 44 | Dashboard, content mgmt |
| 4 | ANALYTICS | 7 | 32 | Watch time, reports |
| 5 | AI | 12 | 61 | Chat, safety, logging |
| 6 | ADVANCED | 10 | 73 | Gamification, PWA |

**Grand Total: 94 tickets | 449 story points**

*Note: Explorer and Independent modes combined into single Explorer mode (ages 5-12)*

---

## Dependency Graph (Critical Path)

```
SSK-001 (Scaffolding)
    │
    ├─► SSK-002 (Next.js) ─► SSK-021 (Auth) ─► SSK-023 (Login)
    │                                              │
    │                                              ├─► SSK-024 (Child Profiles)
    │                                              │       │
    │                                              │       └─► SSK-025 (Profile Select)
    │                                              │               │
    │                                              │               └─► SSK-071 (Child Layout)
    │                                              │                       │
    │                                              │                       └─► SSK-072 (Toddler Home)
    │                                              │                       └─► SSK-073 (Explorer Home)
    │                                              │
    │                                              └─► SSK-121 (Admin Layout)
    │                                                      │
    │                                                      └─► SSK-122 (Dashboard)
    │
    └─► SSK-003 (Docker) ─► SSK-004 (Database)
            │                    │
            │                    └─► SSK-036 (Video CRUD)
            │                            │
            │                            └─► SSK-037 (YT Import)
            │                                    │
            │                                    └─► SSK-038 (Download Worker)
            │                                            │
            │                                            └─► SSK-039 (Transcode)
            │                                                    │
            │                                                    └─► SSK-075 (Video Player)
            │                                                            │
            │                                                            └─► SSK-077 (Watch Tracking)
            │                                                                    │
            │                                                                    └─► SSK-156 (Analytics)
            │
            ├─► SSK-005 (MinIO)
            │
            ├─► SSK-006 (Redis) ─► SSK-008 (Job Queue)
            │
            ├─► SSK-007 (Meilisearch) ─► SSK-048 (Search Index) ─► SSK-081 (Search)
            │
            └─► SSK-181 (Ollama) ─► SSK-182-184 (AI Safety) ─► SSK-185 (AI Chat API)
                                                                      │
                                                                      └─► SSK-186 (Toddler AI)
                                                                      └─► SSK-187 (Explorer AI)
```

---

## Quick Reference: MVP Tickets

**Minimum Viable Product requires these tickets:**

### Infrastructure (8 tickets)
- SSK-001, SSK-002, SSK-003, SSK-004, SSK-005, SSK-006, SSK-008, SSK-009

### Authentication (5 tickets)
- SSK-021, SSK-022, SSK-023, SSK-024, SSK-025

### Content (8 tickets)
- SSK-036, SSK-037, SSK-038, SSK-039, SSK-040, SSK-041, SSK-048, SSK-042

### Child UI (9 tickets)
- SSK-071, SSK-072, SSK-073, SSK-075, SSK-077, SSK-078, SSK-079, SSK-081, SSK-083, SSK-085, SSK-090

### Admin (4 tickets)
- SSK-121, SSK-122, SSK-123, SSK-125

### Analytics (2 tickets)
- SSK-156, SSK-158

**MVP Total: 36 tickets**

*Note: With combined Explorer mode (ages 5-12), UI development is streamlined*

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial checklist |
| 1.1 | January 2026 | Combined Explorer + Independent modes into single Explorer mode (5-12). Removed SSK-074, SSK-188. Updated SSK-073, SSK-187. Reduced total from 96 to 94 tickets. |
