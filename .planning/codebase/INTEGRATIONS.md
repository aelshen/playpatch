# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**Language Models (Dual Provider):**
- OpenAI API - Cloud LLM service
  - SDK: `openai` 6.16.0
  - Client: `apps/web/src/lib/ai/openai-client.ts`
  - Model: `gpt-4o-mini` (default, configurable)
  - Auth: `OPENAI_API_KEY` environment variable
  - Usage: Chat completions with streaming support
  - Fallback to Ollama if OpenAI unavailable

- Ollama API - Local LLM service
  - Custom client: `apps/web/src/lib/ai/client.ts`
  - Endpoint: `OLLAMA_URL` (default: http://localhost:11434)
  - Model: `OLLAMA_MODEL` (default: llama3.1:8b)
  - No authentication required (local)
  - Supports: chat, streaming, model listing

## Data Storage

**Databases:**
- PostgreSQL 16
  - Provider: Docker image `postgres:16-alpine`
  - Connection: `DATABASE_URL` environment variable
  - Format: `postgresql://playpatch:playpatch_dev@localhost:5433/playpatch`
  - Client: `@prisma/client` 5.9.1 (ORM)
  - Schema: `apps/web/prisma/schema.prisma`
  - Migrations: Prisma migrations in `apps/web/prisma/migrations/`

**File Storage (Configurable):**
- Local Filesystem (Default)
  - Type: `STORAGE_TYPE=local`
  - Path: `LOCAL_STORAGE_PATH` environment variable (default: ./storage)
  - Client: `apps/web/src/lib/storage/local.ts`
  - Buckets supported: videos, thumbnails, avatars, journals

- MinIO / S3-Compatible
  - Type: `STORAGE_TYPE=minio` (currently not migrated)
  - Endpoint: `MINIO_ENDPOINT` (default: localhost:9000)
  - Auth: `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - Buckets: videos, thumbnails, avatars, journals
  - SDK: `minio` 7.1.3
  - Docker: `minio/minio:latest` container
  - Bucket setup: Automated via `minio-setup` service

- AWS S3 (Production Alternative)
  - Configuration commented in `.env.example`
  - Env vars: `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - Not yet implemented in storage client

**Caching:**
- Redis 7
  - Client: `ioredis` 5.3.2
  - Connection: `REDIS_URL` (default: redis://localhost:6379)
  - Uses: Session storage, rate limiting, cache layer
  - Docker: `redis:7-alpine` with persistence
  - Client module: `apps/web/src/lib/cache/client.ts`
  - Features: Key expiry, sorted sets for rate limiting, session helpers

## Search & Indexing

**Meilisearch:**
- Version: v1.6 (Docker)
- Endpoint: `MEILISEARCH_URL` (default: http://localhost:7700)
- API Key: `MEILISEARCH_KEY` environment variable
- SDK: `meilisearch` 0.37.0
- Client: `apps/web/src/lib/search/client.ts`
- Indexes:
  - `videos` - Full-text search on title, description, topics, categories
  - `transcripts` - Transcript indexing (defined but not fully implemented)
- Features:
  - Searchable attributes: title, description, topics, categories
  - Filterable attributes: ageRating, categories, topics, approvalStatus, familyId
  - Sortable attributes: createdAt, duration, title

## Authentication & Identity

**Auth Provider:**
- NextAuth.js 5.0.0-beta.4
  - Strategy: Credentials-based (email/password)
  - Provider: Custom Credentials provider
  - Config: `apps/web/src/lib/auth/config.ts` (server-side)
  - Base config: `apps/web/src/lib/auth/config.base.ts` (middleware-safe)
  - Session encryption: `NEXTAUTH_SECRET` (required)
  - Session URL: `NEXTAUTH_URL` (default: http://localhost:3000)

**Password Management:**
- bcrypt 5.1.1 - Password hashing and verification
- Dynamic import to avoid Edge Runtime issues

**Session & Database:**
- User model in Prisma schema: `apps/web/prisma/schema.prisma`
- Session storage: Redis via NextAuth.js adapter
- JWT callback for token generation with user metadata (id, email, role, familyId)

## Job Queue & Background Jobs

**Queue System:**
- BullMQ 5.3.0 - Redis-based job queue
- Connection: Uses same Redis instance as cache (`REDIS_URL`)
- Queues managed by workers: `packages/workers/`

**Worker Processes:**
- Video Download Worker - `apps/web/src/workers/video-download.ts`
  - Jobs: Download videos from YouTube, Vimeo, etc.
  - Status tracking: PENDING → DOWNLOADING → PROCESSING → READY/ERROR
  - Queue job type: Tracked in `BackgroundJob` Prisma model

- Video Transcode Worker - `apps/web/src/workers/video-transcode.ts`
  - Jobs: Transcode videos to HLS format
  - Status tracking: isTranscoded flag in Video model
  - Queue integration: BullMQ

**Worker Startup:**
- Entry point: `packages/workers/src/index.ts`
- Initializes both download and transcode workers
- Graceful shutdown on SIGTERM/SIGINT
- Logging via Pino logger

## Monitoring & Observability

**Error Tracking:**
- Not detected - Console errors logged but no external service

**Logs:**
- Framework: Pino 8.18.0 (structured logging)
- Config: `apps/web/src/lib/logger.ts`
- Level-based logging (info, warn, error, debug)
- Used throughout: AI client, storage, cache, auth

**Health Checks:**
- Endpoint: `apps/web/src/app/api/health/route.ts`
- Route: `/api/health`
- Checks: Database, Redis, search, AI providers availability
- Manual check: `npm run health:check` or `npm run health:api`

## CI/CD & Deployment

**Hosting:**
- Docker Compose for local/production deployment
- Compose files: `infrastructure/compose/docker-compose.yml`
- Environment configs: `docker-compose.dev.yml`, `docker-compose.prod.yml`

**Deployment Strategy:**
- Multi-container orchestration with Docker Compose
- Services: PostgreSQL, Redis, MinIO, Meilisearch, Ollama, Next.js app
- Network: `playpatch_network` (bridge)
- Volume management: Named volumes for data persistence

**CI Pipeline:**
- Not detected - No GitHub Actions or CI service configured

**Build Process:**
- Turbo monorepo orchestrator for build steps
- Scripts defined in root `package.json`
- Build command: `turbo run build`
- Docker build integrated via Compose

## Environment Configuration

**Required Environment Variables:**

*Application:*
- `NODE_ENV` - development/production
- `NEXT_PUBLIC_APP_URL` - Frontend URL

*Database:*
- `DATABASE_URL` - PostgreSQL connection string
- `DB_PASSWORD` - Database password

*Cache & Queue:*
- `REDIS_URL` - Redis connection
- `REDIS_PASSWORD` - Optional Redis password

*Storage:*
- `STORAGE_TYPE` - 'local' or 'minio'
- `LOCAL_STORAGE_PATH` - Local filesystem path (if local storage)
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` - MinIO config
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO credentials
- `MINIO_BUCKET_VIDEOS`, `MINIO_BUCKET_THUMBNAILS`, `MINIO_BUCKET_AVATARS`

*Search:*
- `MEILISEARCH_URL` - Meilisearch endpoint
- `MEILISEARCH_KEY` - API key

*AI/LLM:*
- `AI_PROVIDER` - 'ollama' or 'openai'
- `OLLAMA_URL` - Ollama endpoint
- `OLLAMA_MODEL` - Model name
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)

*Authentication:*
- `NEXTAUTH_SECRET` - Session encryption key (required)
- `NEXTAUTH_URL` - Auth callback URL

*Email (Optional):*
- `SMTP_HOST`, `SMTP_PORT` - SMTP server
- `SMTP_USER`, `SMTP_PASS` - SMTP credentials
- `SMTP_SECURE` - TLS enabled
- `EMAIL_FROM` - From address
- `ENABLE_WEEKLY_DIGEST` - Feature flag

*Feature Flags:*
- `ENABLE_AI` - Enable AI features
- `ENABLE_TRANSCRIPTION` - Enable audio transcription
- `ENABLE_WEEKLY_DIGEST` - Enable email digests
- `NEXT_PUBLIC_AI_ENABLED` - Client-side AI feature flag

*Media Processing:*
- `WHISPER_MODEL` - Speech-to-text model
- `MAX_VIDEO_SIZE_MB` - Maximum video file size
- `TRANSCODE_QUALITY` - Default transcode quality (e.g., 720p)

*Rate Limiting:*
- `RATE_LIMIT_ENABLED` - Enable rate limiting
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `RATE_LIMIT_WINDOW_MS` - Time window in milliseconds

**Secrets Location:**
- Environment variables in `.env` file (git-ignored)
- `.env.example` provided as template
- Setup script: `pnpm run setup:env` creates `.env` from template

## Webhooks & Callbacks

**Incoming Webhooks:**
- Not detected - No webhook endpoints configured

**Outgoing Webhooks:**
- Potential email notifications planned for requests (commented)
- Weekly digest feature supports SMTP but not fully implemented
- No outbound webhook integrations detected

## Integration Clients Summary

**AI Service Integration:** `apps/web/src/lib/ai/service.ts`
- Abstracts Ollama and OpenAI clients
- AI safety filtering applied to all inputs/outputs
- Imports from `@playpatch/ai-safety` package

**Storage Abstraction:** `apps/web/src/lib/storage/client.ts`
- Interface pattern: `StorageBackend` interface
- Implementations: LocalStorageBackend (active), MinIOBackend (stubbed)
- Unified API for file operations

**Cache Pattern:** `apps/web/src/lib/cache/client.ts`
- Session helpers for auth
- Rate limiting implementation
- Key-value operations with TTL support

---

*Integration audit: 2026-01-22*
