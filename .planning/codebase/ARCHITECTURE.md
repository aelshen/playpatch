# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Layered monorepo with Next.js full-stack (server and client components), background workers, and shared libraries. Uses domain-driven design with separate concern modules (sync, recommendations, AI, search, media).

**Key Characteristics:**
- Server-Driven Architecture: Next.js App Router with Server Components (default), client components where needed (interactive UI, real-time updates)
- Modular Backend: Separated concerns into lib modules (auth, db, queue, storage, sync, ai, search, recommendations, media)
- Background Job Processing: BullMQ + Redis for asynchronous video processing and channel synchronization
- API Layer: RESTful HTTP routes using Next.js App Router (`/api` directory)
- Monorepo Structure: pnpm workspace with shared packages (`@playpatch/shared`, `@playpatch/ai-safety`, `@playpatch/workers`)
- Microservices-Ready: Workers can be deployed separately, storage is abstraction-based

## Layers

**Presentation Layer (Client):**
- Purpose: User interface components, form handling, state management for client-side features
- Location: `apps/web/src/app` (pages), `apps/web/src/components` (reusable UI)
- Contains: Next.js pages, route segments, React components (mostly Server Components with islands of client components)
- Depends on: Auth system, API routes, shared types
- Used by: End users (parents and children via browsers)

**API Layer:**
- Purpose: HTTP endpoints exposing business logic to frontend and external consumers
- Location: `apps/web/src/app/api`
- Contains: Route handlers using Next.js App Router conventions (`route.ts` files)
- Depends on: Database, auth, search, recommendations, media handling, storage
- Used by: Frontend fetch calls, external integrations (webhooks, third-party services)
- Pattern: Modular routes organized by domain (auth, videos, playlists, channels, sync, recommendations, analytics, AI)

**Service Layer:**
- Purpose: Business logic, domain-specific operations, orchestration
- Location: `apps/web/src/lib/*` (modular services)
- Contains:
  - `auth/`: Authentication and session management (NextAuth config, user session handling)
  - `db/queries/`: Database query abstractions organized by entity (videos, profiles, recommendations, analytics)
  - `queue/`: Job queue definitions and enqueue helpers using BullMQ
  - `sync/`: Channel synchronization service (YouTube video discovery and import)
  - `recommendations/`: Recommendation engine with scoring algorithms
  - `ai/`: AI service integrating Ollama/OpenAI with safety filters
  - `search/`: Meilisearch client and indexing
  - `media/`: YouTube metadata fetching and video information extraction
  - `storage/`: Abstracted storage interface (local filesystem or MinIO/S3)
  - `cache/`: Redis-based caching
  - `health/`: Service health checks
- Depends on: Database, external APIs, queues, storage
- Used by: API routes, server actions, worker processes

**Data Access Layer:**
- Purpose: Database interactions and persistence
- Location: `apps/web/src/lib/db/client.ts` (Prisma client), `apps/web/src/lib/db/queries/` (query abstractions)
- Contains: Prisma ORM setup with singleton pattern, typed query functions per entity
- Depends on: PostgreSQL database
- Used by: All service layer modules, API routes

**Worker Layer:**
- Purpose: Background job processing for long-running operations
- Location: `apps/web/src/workers/` (worker definitions), `packages/workers/src/` (worker orchestration)
- Contains: Video download, transcode, transcription, cleanup, thumbnail generation, channel sync workers
- Depends on: Queue system (Redis/BullMQ), storage, database, media processing tools
- Used by: API routes (queue job submissions), scheduled tasks

**Shared Packages Layer:**
- Purpose: Reusable code across monorepo
- Location: `packages/`
- Contains:
  - `@playpatch/shared`: Types, constants, utilities, validators
  - `@playpatch/ai-safety`: AI safety filters, prompt templates
  - `@playpatch/workers`: Worker initialization and management
- Depends on: External libraries
- Used by: Main app, worker processes

## Data Flow

**Video Import & Processing Flow:**

1. **User initiates import** → API route (`/api/channels/sync`) receives channel sync request
2. **Service layer** (`sync/channel-sync.ts`) → Fetches channel metadata from YouTube using media service
3. **Job queuing** → `addVideoImportJob()` queues download + processing tasks in BullMQ
4. **Workers process** → Download worker fetches video file, transcode worker converts to HLS format
5. **Storage layer** → Files stored in local filesystem or MinIO (abstracted via `storage/client.ts`)
6. **Database update** → Video record created with status transitions (PENDING → DOWNLOADING → PROCESSING → READY)
7. **Search indexing** → Completed video automatically indexed in Meilisearch
8. **Database query** → Returns completion status via `/api/queue/[videoId]/status`

**Watch & Recommendation Flow:**

1. **Child watches video** → `VideoPlayer` component loads HLS stream via `/api/video/{familyId}/{videoId}/hls/master.m3u8`
2. **Progress tracking** → Periodic POST to `/api/watch/[videoId]/progress` records watch session
3. **Recommendation request** → `/api/recommendations/[videoId]` calls recommendation engine
4. **Scoring algorithm** → Engine queries similar videos based on categories, topics, watch history, age ratings
5. **Results returned** → Sorted recommendations (+ reasons) sent to frontend
6. **Analytics** → Watch session data stored in database for trend analysis

**AI Conversation Flow:**

1. **Child sends message** → `/api/ai/chat` receives message with safety check
2. **Input filtering** → AI safety module filters inappropriate content
3. **Ollama/OpenAI client** → Service constructs prompt, sends to LLM
4. **Output filtering** → Response validated through safety filters
5. **Database persistence** → Conversation logged with filtering status
6. **Analytics** → Safety metrics tracked and queryable via `/api/analytics/ai/safety`

**State Management:**

- **Server State:** Database (Prisma) is source of truth for persistent data
- **Client State:** Minimal client-side state via React hooks, some UI state management via Zustand (stores folder, currently empty)
- **Session State:** NextAuth session in HTTP-only cookies, validated via middleware
- **Cache:** Redis cache for hot data (optional, initialized but minimal usage currently)

## Key Abstractions

**Storage Backend Abstraction:**
- Purpose: Decouple storage implementation (local vs. cloud)
- Examples: `apps/web/src/lib/storage/client.ts`, `apps/web/src/lib/storage/interface.ts`, `apps/web/src/lib/storage/local.ts`
- Pattern: Strategy pattern with StorageBackend interface, runtime selection via `STORAGE_TYPE` env var
- Methods: uploadFile, downloadFile, getFileUrl, deleteFile, listFiles, fileExists

**Database Query Abstraction:**
- Purpose: Typed, domain-organized database operations
- Examples: `apps/web/src/lib/db/queries/videos.ts`, `apps/web/src/lib/db/queries/recommendations.ts`
- Pattern: Named export functions grouped by entity, each function encapsulates specific query logic
- Benefits: Query reusability across routes, easier testing, single source of truth for data access

**Job Queue Abstraction:**
- Purpose: Uniform interface for enqueueing background jobs
- Example: `apps/web/src/lib/queue/client.ts`
- Pattern: Named helper functions (`addVideoDownloadJob`, `addChannelSyncJob`, etc.) that wrap BullMQ queue operations
- Retry Policy: 3 attempts with exponential backoff (1s base delay)
- Job Retention: Completed jobs kept 1 day, failed jobs kept 7 days

**AI Service Abstraction:**
- Purpose: Provider-agnostic AI interface with safety filtering
- Example: `apps/web/src/lib/ai/service.ts`
- Pattern: Runtime selection between Ollama and OpenAI via `AI_PROVIDER` env var
- Safety Layer: Input/output filtering via `@playpatch/ai-safety` package
- Persistence: All conversations logged to database with filtering metadata

**Search Engine Abstraction:**
- Purpose: Full-text search with filtering on video metadata
- Example: `apps/web/src/lib/search/client.ts`
- Pattern: Meilisearch client with hardcoded indexes (videos, transcripts)
- Indexes: Searchable attributes (title, description, topics, categories), filterable (ageRating, categories, approvalStatus, familyId)

**Recommendation Engine:**
- Purpose: Content-based recommendations with weighted scoring
- Example: `apps/web/src/lib/recommendations/engine.ts`
- Pattern: Multi-source candidate selection (topic matches, category matches, channel videos, popular videos) scored by weights
- Weights: Category match (40%), topic overlap (30%), watch history (20%), age appropriateness (10%)

## Entry Points

**Web Application:**
- Location: `apps/web/src/app/layout.tsx` (root layout), `apps/web/src/app/page.tsx` (home page)
- Triggers: User navigates to `http://localhost:3000` or any route
- Responsibilities: Render root HTML, manage global layout, handle route navigation

**API Server:**
- Location: `apps/web/src/app/api/**` (all route.ts files)
- Triggers: HTTP requests to `/api/*` paths
- Responsibilities: Request validation, business logic execution, response formatting
- Example routes:
  - `apps/web/src/app/api/auth/[...nextauth]/route.ts`: NextAuth authentication
  - `apps/web/src/app/api/playlists/route.ts`: Playlist CRUD operations
  - `apps/web/src/app/api/recommendations/[videoId]/route.ts`: Video recommendations
  - `apps/web/src/app/api/sync/channels/route.ts`: Channel synchronization
  - `apps/web/src/app/api/health/route.ts`: Service health status

**Middleware:**
- Location: `apps/web/src/middleware.ts`
- Triggers: All requests matching configured paths (excludes static files, auth routes)
- Responsibilities: Route protection (block children from /admin), session validation, redirects

**Worker Process:**
- Location: `packages/workers/src/index.ts`
- Triggers: Manual startup via `pnpm workers` command
- Responsibilities: Initialize all job workers, listen for queued jobs, process videos asynchronously
- Worker Types:
  - Video download: `apps/web/src/workers/video-download.ts`
  - Video transcode: `apps/web/src/workers/video-transcode.ts`

**Server Actions:**
- Location: `apps/web/src/lib/actions/*.ts` (marked with 'use server')
- Triggers: Client component form submissions
- Responsibilities: Backend operations from client components without explicit API route
- Examples: `video-import.ts`, `profile-selection.ts`, `child-profiles.ts`

## Error Handling

**Strategy:** Multi-level error handling with graceful degradation.

**Patterns:**

1. **API Routes:** Try-catch with NextResponse error responses (400 for validation, 404 for not found, 500 for server errors)
   - Example: `apps/web/src/app/api/playlists/route.ts` catches errors and returns structured JSON with status code
   - Logging: Console.error for debugging (should use structured logger)

2. **Service Layer:** Throw descriptive errors that API routes catch and format
   - Example: `apps/web/src/lib/sync/channel-sync.ts` throws "Channel not found", "Failed to create video"
   - Logging: Pino logger (`apps/web/src/lib/logger.ts`) for structured logs

3. **Database Operations:** Prisma errors bubble up, caught at service level
   - Unique constraint violations: Prisma throws error, service layer maps to business logic response

4. **Job Processing:** Worker errors trigger retry logic (3 attempts, exponential backoff)
   - Failed job details: Stored in Redis, queryable via queue stats
   - Graceful shutdown: Workers catch SIGTERM/SIGINT, close connections cleanly

5. **Health Checks:** Service health monitored at `/api/health`, returns overall + per-service status
   - Status codes: 200 if healthy, 503 if unhealthy
   - Services checked: Database, Redis, storage backend

## Cross-Cutting Concerns

**Logging:**
- Tool: Pino (JSON structured logging)
- Configuration: `apps/web/src/lib/logger.ts` exports singleton logger
- Usage: Services use `logger.info()`, `logger.error()` with structured context
- Development: Query/error logs enabled; Production: errors only

**Validation:**
- Input validation: Request body validation in API routes (manual + zod schemas in `@playpatch/shared`)
- Type safety: TypeScript throughout with strict mode
- Database constraints: Prisma schema defines required fields, unique constraints

**Authentication:**
- Provider: NextAuth v5 (beta)
- Session storage: HTTP-only secure cookies
- User context: `getCurrentUser()` server function in `apps/web/src/lib/auth/session.ts`
- Role-based access: USER_ROLE enum (ADMIN, VIEWER) in Prisma schema
- Child sessions: Separate `child-session` cookie for profile switching

**Authorization:**
- Route-level: Middleware blocks unauthenticated access to /admin
- Feature-level: API routes check current user before operations
- Child access: Middleware validates child profile selection, redirects appropriately

**Performance:**
- Database: Prisma select/include for efficient queries (avoid N+1)
- Search: Meilisearch for full-text search instead of database LIKE queries
- Caching: Redis client available but not heavily used (opportunity for optimization)
- Job processing: Background queue for heavy operations (video processing)
- CDN: Static assets served from /public, thumbnails from /api/thumbnails/[...path]

---

*Architecture analysis: 2026-01-22*
