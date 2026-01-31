# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
playpatch/
├── apps/
│   └── web/                        # Main Next.js application
│       ├── src/
│       │   ├── app/                # Next.js App Router pages and API routes
│       │   ├── components/         # React components
│       │   ├── lib/                # Business logic and services
│       │   ├── workers/            # Background job worker definitions
│       │   ├── stores/             # Client state management (Zustand)
│       │   ├── types/              # TypeScript type definitions
│       │   ├── middleware.ts        # Next.js route middleware
│       │   └── __tests__/          # Application tests
│       ├── prisma/                 # Database schema and migrations
│       ├── storage/                # Local file storage directory
│       ├── public/                 # Static assets
│       ├── .next/                  # Next.js build output
│       └── package.json
├── packages/
│   ├── shared/                     # Shared types, constants, utilities
│   │   └── src/
│   │       ├── types/              # Shared TypeScript types
│   │       ├── constants/          # App-wide constants
│   │       ├── utils/              # Utility functions
│   │       └── validators/         # Zod validation schemas
│   ├── ai-safety/                  # AI safety filtering module
│   │   └── src/
│   │       ├── filters/            # Input/output safety filters
│   │       └── prompts/            # AI system prompts
│   └── workers/                    # Worker process orchestration
│       └── src/
│           └── utils/              # Worker utilities
├── infrastructure/
│   ├── compose/                    # Docker compose configs
│   │   ├── docker-compose.yml      # Base compose file
│   │   ├── docker-compose.dev.yml  # Development overrides
│   │   └── docker-compose.prod.yml # Production overrides
│   ├── docker/                     # Docker images
│   │   ├── app.Dockerfile         # Next.js app image
│   │   └── workers.Dockerfile     # Worker process image
│   └── scripts/                    # Setup, deployment, health check scripts
├── docs/                           # Project documentation
├── tests/                          # Integration and E2E tests
│   ├── integration/                # API integration tests
│   ├── e2e/                       # End-to-end tests
│   └── fixtures/                   # Test data and factories
├── .env                            # Environment variables (git-ignored)
├── .env.example                    # Example env template
├── pnpm-workspace.yaml             # pnpm monorepo config
├── package.json                    # Root package.json with scripts
├── pnpm-lock.yaml                 # pnpm lock file
└── tsconfig.json                   # Root TypeScript config
```

## Directory Purposes

**`apps/web/`:**
- Purpose: Main web application - full-stack Next.js with database, API, workers
- Contains: All application code, pages, API routes, database schema
- Key files: `package.json`, `next.config.js`, `tsconfig.json`, `jest.config.js`

**`apps/web/src/`:**
- Purpose: Application source code root
- Contains: All TypeScript/TSX application files
- Key files: `middleware.ts` (route protection), `__tests__/` (test suite)

**`apps/web/src/app/`:**
- Purpose: Next.js App Router page structure and API routes
- Pattern: File-based routing (directory = route segment, `page.tsx` = rendered component, `route.ts` = API endpoint)
- Structure:
  - `app/page.tsx`: Home page (landing, redirects to dashboard/login)
  - `app/auth/`: Authentication pages (login, register, error)
  - `app/profiles/`: Child profile selection UI
  - `app/child/`: Child-facing pages (explorer, toddler modes, watch, player)
  - `app/admin/`: Parent dashboard (content, channels, analytics, profiles, queue)
  - `app/api/`: All HTTP API endpoints
    - `api/auth/`: NextAuth authentication routes
    - `api/playlists/`: Playlist CRUD operations
    - `api/videos/`: Video operations
    - `api/channels/`: Channel management and preview
    - `api/sync/`: Channel synchronization
    - `api/queue/`: Job queue status
    - `api/recommendations/`: Recommendation engine
    - `api/ai/`: AI chat, conversations, analytics
    - `api/watch/`: Video watch progress tracking
    - `api/analytics/`: Comprehensive analytics endpoints
    - `api/health/`: Service health checks
    - `api/video/`: HLS video streaming
    - `api/thumbnails/`: Thumbnail serving
    - `api/favorites/`: Favorite video management
    - `api/requests/`: User requests
    - `api/search/`: Search endpoints

**`apps/web/src/components/`:**
- Purpose: Reusable React components
- Organization by feature:
  - `ui/`: Base UI components (buttons, forms, dialogs, etc.)
  - `layout/`: Page layout components (navigation, headers)
  - `auth/`: Authentication form components
  - `player/`: Video player components (VideoPlayer, PlayerControls, ProgressBar)
  - `child/`: Child view components
  - `admin/`: Admin panel components
  - `analytics/`: Dashboard and chart components
  - `channels/`: Channel management components
  - `profiles/`: Profile management components
  - `charts/`: Recharts-based visualization components
  - `shared/`: Cross-cutting shared components
- Naming: Lower kebab-case files (e.g., `video-player.tsx`)

**`apps/web/src/lib/`:**
- Purpose: Business logic, services, utilities
- Organization by domain:
  - `auth/`: Authentication, session management, NextAuth config
  - `db/`: Database client, connection pooling
    - `client.ts`: Prisma singleton client
    - `queries/`: Entity-specific query functions (videos.ts, profiles.ts, etc.)
  - `queue/`: Job queue setup (BullMQ) and enqueueing helpers
  - `sync/`: Channel synchronization service
  - `recommendations/`: Recommendation engine and algorithms
  - `ai/`: AI service (Ollama/OpenAI integration, safety filters)
  - `search/`: Meilisearch client and indexing
  - `media/`: External media service (YouTube metadata fetching)
  - `storage/`: Storage abstraction (local filesystem, MinIO)
  - `cache/`: Redis caching client
  - `health/`: Service health check implementations
  - `actions/`: Server action definitions ('use server')
  - `constants/`: Application constants
  - `utils/`: Utility functions
- Naming: Lower kebab-case files, index.ts for exports

**`apps/web/src/workers/`:**
- Purpose: Background job worker definitions
- Contains:
  - `video-download.ts`: Download worker (fetches video from YouTube)
  - `video-transcode.ts`: Transcode worker (converts to HLS format)
  - `index.ts`: Worker orchestration entry point
- Trigger: `pnpm workers` command starts all workers

**`apps/web/src/stores/`:**
- Purpose: Client-side state management (Zustand)
- Currently: Empty/placeholder (minimal client state needed)
- Usage: For complex client-side state when needed

**`apps/web/src/types/`:**
- Purpose: Application TypeScript type definitions
- Contains: Custom types extending NextAuth, global type augmentations

**`apps/web/src/__tests__/`:**
- Purpose: Application test suite
- Organization mirrors src structure:
  - `__tests__/lib/`: Tests for lib modules
    - `__tests__/lib/db/`: Database query tests
    - `__tests__/lib/utils/`: Utility function tests
  - `__tests__/integration/`: API integration tests

**`apps/web/prisma/`:**
- Purpose: Database schema and migrations
- Contains:
  - `schema.prisma`: Prisma database schema (entities, relationships, enums)
  - `migrations/`: Auto-generated migration files (directory per migration)
  - `seed.ts`: Database seed script for development
- Key: Schema defines all data models (Family, User, ChildProfile, Video, etc.)

**`apps/web/storage/`:**
- Purpose: Local file storage for videos, thumbnails, HLS streams
- Structure: Created at runtime by storage backend
- Buckets: Mirrors local directories (videos/, thumbnails/, hls/)

**`packages/shared/`:**
- Purpose: Shared code used by multiple packages
- Contains:
  - `src/types/`: Shared TypeScript type definitions
  - `src/constants/`: App-wide constants (queue names, age ratings, etc.)
  - `src/utils/`: Utility functions (formatters, validators)
  - `src/validators/`: Zod schemas for validation
- Exports: Via package.json exports field and barrel file (`src/index.ts`)
- Usage: Imported as `@playpatch/shared` in other packages

**`packages/ai-safety/`:**
- Purpose: AI safety filtering for user inputs and LLM outputs
- Contains:
  - `src/filters/`: Filter implementations (content, age-appropriate, etc.)
  - `src/prompts/`: System prompts for AI models
  - `src/filters/__tests__/`: Filter unit tests
- Exports: Filter functions and prompt builders
- Usage: Imported as `@playpatch/ai-safety` in main app

**`packages/workers/`:**
- Purpose: Worker process setup and orchestration
- Contains:
  - `src/index.ts`: Main entry point, initializes all workers
  - `src/utils/`: Worker utilities (logger, etc.)
- Exports: Worker initialization functions
- Entry: Runs via `packages/workers/src/index.ts`

**`infrastructure/compose/`:**
- Purpose: Docker Compose configuration for local development and production
- Contains:
  - `docker-compose.yml`: Core services (postgres, redis, minio, ollama, meilisearch)
  - `docker-compose.dev.yml`: Development overrides (volume mounts, port mappings)
  - `docker-compose.prod.yml`: Production overrides (resource limits, restarts)
- Services: Database, Redis, object storage, LLM, search engine, app container
- Usage: `pnpm docker:dev` starts development environment

**`infrastructure/docker/`:**
- Purpose: Docker image definitions
- Contains:
  - `app.Dockerfile`: Next.js application image
  - `workers.Dockerfile`: Worker process image
- Multi-stage builds for optimized production images

**`infrastructure/scripts/`:**
- Purpose: Setup, deployment, and utility scripts
- Contains:
  - `setup-all.sh`: Initial setup script
  - `dev-start.sh`: Local development startup
  - `health-check.sh`: Service health verification
  - `db-reset.sh`: Database reset for development

**`docs/`:**
- Purpose: Project documentation
- Contains: Design docs, implementation guides, API documentation

**`tests/`:**
- Purpose: Integration and end-to-end tests
- Structure:
  - `integration/`: API endpoint tests
  - `e2e/`: User workflow tests (Playwright)
  - `fixtures/`: Test data and factory functions

## Key File Locations

**Entry Points:**
- `apps/web/src/app/page.tsx`: Home/landing page
- `apps/web/src/app/layout.tsx`: Root layout (HTML structure)
- `apps/web/src/app/api/**`: API endpoints
- `apps/web/src/middleware.ts`: Route protection middleware
- `packages/workers/src/index.ts`: Worker process startup

**Configuration:**
- `apps/web/package.json`: App scripts and dependencies
- `apps/web/next.config.js`: Next.js configuration
- `apps/web/tsconfig.json`: TypeScript app config
- `apps/web/jest.config.js`: Testing framework config
- `apps/web/prisma/schema.prisma`: Database schema
- `package.json`: Root workspace scripts
- `pnpm-workspace.yaml`: Monorepo workspace definition
- `.env`: Environment variables (port, database URL, API keys)

**Core Logic:**
- `apps/web/src/lib/db/`: Database operations and queries
- `apps/web/src/lib/sync/`: Channel synchronization service
- `apps/web/src/lib/recommendations/`: Recommendation engine
- `apps/web/src/lib/ai/`: AI integration and safety filters
- `apps/web/src/lib/auth/`: Authentication and session management
- `apps/web/src/lib/queue/`: Background job queue setup
- `apps/web/src/lib/storage/`: File storage abstraction

**Testing:**
- `apps/web/src/__tests__/`: Unit and integration tests
- `tests/`: End-to-end tests
- `apps/web/jest.config.js`: Test runner configuration

## Naming Conventions

**Files:**
- Components: Lower kebab-case (e.g., `video-player.tsx`, `player-controls.tsx`)
- Utilities: Lower kebab-case (e.g., `format-duration.ts`)
- Hooks: Lower kebab-case starting with "use" (e.g., `use-video-player.ts`)
- Services: Lower kebab-case (e.g., `channel-sync.ts`, `openai-client.ts`)
- API routes: `route.ts` in appropriate directory (Next.js convention)
- Tests: Match source file with `.test.ts` or `.spec.ts` suffix
- Database migrations: Timestamp + description (auto-generated by Prisma)

**Directories:**
- Feature/domain directories: Plural or feature name (e.g., `components/`, `lib/`, `auth/`, `admin/`)
- Nested routes: Bracketed for dynamic segments (e.g., `[videoId]/`, `[...path]/`)
- Page containers: `page.tsx` in route directory

**Functions:**
- Async service functions: camelCase, descriptive verb names (e.g., `syncChannel()`, `getRecommendedVideos()`)
- Helper utilities: camelCase (e.g., `formatDuration()`, `calculateAge()`)
- React components: PascalCase (e.g., `VideoPlayer`, `PlayerControls`)
- Server actions: camelCase with 'Action' suffix (e.g., `importVideosAction()`)

**Types & Interfaces:**
- TypeScript types: PascalCase (e.g., `VideoWithChannel`, `RecommendationParams`)
- Database models: PascalCase (Prisma convention)
- Enums: PascalCase (e.g., `AgeRating`, `UIMode`)

## Where to Add New Code

**New Feature (e.g., Ratings System):**
- Primary code: `apps/web/src/lib/ratings/engine.ts` (service logic)
- Database: Add model to `apps/web/prisma/schema.prisma`
- API route: `apps/web/src/app/api/ratings/route.ts`
- Components: `apps/web/src/components/ratings/RatingWidget.tsx`
- Tests: `apps/web/src/__tests__/lib/ratings/` (logic) and integration test in `tests/integration/`

**New Component/UI:**
- Component file: `apps/web/src/components/{feature-name}/{ComponentName}.tsx`
- Styling: Tailwind classes in component JSX
- Tests: Co-located as `{ComponentName}.test.tsx` or in `apps/web/src/__tests__/`
- Export: Add to feature barrel file if creating subdirectory

**New API Endpoint:**
- Route file: `apps/web/src/app/api/{feature}/route.ts` (or `[id]/route.ts` for dynamic)
- Logic: Extract service logic to `apps/web/src/lib/{feature}/` module
- Validation: Add Zod schemas in service module or shared validators
- Tests: Create test in `tests/integration/api/`

**New Service/Business Logic:**
- Service module: `apps/web/src/lib/{domain-name}/{service-name}.ts`
- Exports: Named exports for each function
- Logging: Use `logger` from `lib/logger.ts` for structured logging
- Database access: Use query functions from `lib/db/queries/` or add new ones
- Tests: Unit tests in `apps/web/src/__tests__/lib/{domain}/`

**New Shared Utility/Type:**
- Types: `packages/shared/src/types/{feature}.ts`
- Utils: `packages/shared/src/utils/{feature}.ts`
- Constants: `packages/shared/src/constants/{feature}.ts`
- Validators: `packages/shared/src/validators/{feature}.ts`
- Export: Add to `packages/shared/src/index.ts` barrel
- Usage: Import as `@playpatch/shared` in other packages

**New Database Query:**
- Location: `apps/web/src/lib/db/queries/{entity}.ts`
- Pattern: Named export functions using Prisma client
- Typing: Include full type signatures with Prisma types
- Reusability: Write for maximum reuse across routes
- Organization: Group related queries by entity

**New Background Worker:**
- Definition: `apps/web/src/workers/{job-type}.ts` (exports handler function)
- Queue setup: Add to `apps/web/src/lib/queue/client.ts` helper
- Orchestration: Register in `packages/workers/src/index.ts`
- Testing: Create test in `tests/integration/workers/`
- Job retry: Uses default BullMQ settings (3 attempts, exponential backoff)

**New AI Safety Filter:**
- Implementation: `packages/ai-safety/src/filters/{filter-name}.ts`
- Export: Add to package exports
- Tests: `packages/ai-safety/src/filters/__tests__/{filter-name}.test.ts`
- Integration: Import and apply in `apps/web/src/lib/ai/service.ts`

**Documentation:**
- API documentation: `docs/api/` directory
- Architecture decisions: `docs/adr/` directory
- Setup guides: `docs/setup/` directory
- Implementation guides: `docs/guides/` directory

## Special Directories

**`apps/web/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (at build time)
- Committed: No (in .gitignore)
- Contains: Compiled pages, static assets, server code

**`apps/web/.swc/`:**
- Purpose: SWC compiler cache
- Generated: Yes (at development time)
- Committed: No
- Contains: Cached transpilation results

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by pnpm install)
- Committed: No
- Note: Using pnpm workspace structure with monorepo package linking

**`apps/web/prisma/migrations/`:**
- Purpose: Database migration history
- Generated: Partly (auto-generated by Prisma, edited manually sometimes)
- Committed: Yes (required for reproducible deployments)
- Each migration: Numbered directory with `migration.sql` and `.lock` file

**`apps/web/storage/`:**
- Purpose: Local file storage (development only)
- Generated: Yes (at runtime by storage backend)
- Committed: No
- Buckets: `videos/`, `thumbnails/`, `hls/` (created as needed)

**`tests/`:**
- Purpose: Test suite separate from source tests
- Integration tests: API endpoint testing with real database
- E2E tests: Full user workflow testing with Playwright
- Fixtures: Test data factories and seed data

---

*Structure analysis: 2026-01-22*
