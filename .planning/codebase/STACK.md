# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.3.3 - Entire codebase (web, workers, shared packages)
- JavaScript/JSX - React components and Next.js pages

**Secondary:**
- Bash - Infrastructure and setup scripts in `infrastructure/scripts/`
- SQL - Database migrations and Prisma schema

## Runtime

**Environment:**
- Node.js 20.11.0 (engines: >=20.0.0)

**Package Manager:**
- pnpm 8.15.3 (lockfile: pnpm-lock.yaml)

## Frameworks

**Core:**
- Next.js 14.1.0 - Full-stack web framework at `apps/web`
- React 18.2.0 - UI framework
- React DOM 18.2.0 - DOM rendering

**Form & State Management:**
- React Hook Form 7.50.0 - Form state management
- Zustand 4.5.0 - Client-side state management
- TanStack React Query 5.20.5 - Server state management

**UI & Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Tailwind CSS Animate 1.0.7 - Animation utilities
- Tailwind Merge 2.2.1 - Class merging utility
- Class Variance Authority 0.7.0 - Type-safe component variants
- Framer Motion 11.0.3 - Animation library

**UI Components:**
- Lucide React 0.323.0 - Icon library
- React Day Picker 9.13.0 - Date picker component
- Recharts 3.6.0 - Charting library
- HLS.js 1.6.15 - HLS video streaming
- React Force Graph 2D 1.29.0 - Graph visualization

**Database & ORM:**
- Prisma 5.9.1 - ORM and database toolkit
  - Client: `@prisma/client` 5.9.1
  - Schema: `apps/web/prisma/schema.prisma`
  - Database: PostgreSQL 16 (Alpine)

**Queue/Job System:**
- BullMQ 5.3.0 - Redis-based job queue
  - Used in: `apps/web` and `packages/workers`
  - Supports video download and transcode jobs

**LLM & AI:**
- OpenAI SDK 6.16.0 - OpenAI API client
- Ollama local wrapper - Custom client in `apps/web/src/lib/ai/client.ts`
- Support for both cloud (OpenAI) and local (Ollama) LLMs

**Cache & Session:**
- ioredis 5.3.2 - Redis client
- Redis 7 (Alpine) - Caching and session storage

**Search:**
- Meilisearch 0.37.0 - Full-text search
- Meilisearch server v1.6 (Docker container)

**Object Storage:**
- MinIO SDK 7.1.3 - S3-compatible storage client
- minio container for local development

**Authentication:**
- NextAuth.js 5.0.0-beta.4 - Authentication framework
- bcrypt 5.1.1 - Password hashing
- Credentials provider for email/password auth

**Validation & Parsing:**
- Zod 3.22.4 - Schema validation library
- @hookform/resolvers 3.3.4 - Integration with React Hook Form

**Logging:**
- Pino 8.18.0 - Structured logger

**Testing:**
- Jest 29.7.0 - Test runner
- @testing-library/react 14.3.1 - React testing utilities
- @testing-library/jest-dom 6.9.1 - Jest matchers
- @testing-library/user-event 14.5.1 - User interaction simulation
- jest-environment-jsdom 29.7.0 - Browser-like DOM environment
- jest-mock-extended 3.0.5 - Mock extensions
- ts-jest 29.4.6 - TypeScript Jest integration

**E2E Testing:**
- Playwright 1.42.1 - E2E testing framework

**Build & Dev Tools:**
- Turbo 1.12.4 - Monorepo build orchestrator
- TSX 4.7.1 - TypeScript executor
- Prettier 3.2.5 - Code formatter
- ESLint 8.56.0 - Linter
- TypeScript ESLint Plugin 6.21.0 - TS linting rules
- TypeScript ESLint Parser 6.21.0 - TS parser
- Autoprefixer 10.4.17 - CSS vendor prefixer
- PostCSS 8.4.35 - CSS transformation

**Type Definitions:**
- @types/node 20.11.19 - Node.js types
- @types/react 18.2.55 - React types
- @types/react-dom 18.2.19 - React DOM types
- @types/bcrypt 5.0.2 - Bcrypt types
- @types/hls.js 1.0.0 - HLS.js types
- @types/d3-force 3.0.10 - D3 force types
- @types/jest 29.5.14 - Jest types

## Configuration

**Environment:**
- `.env` (root) - Development environment variables
- `.env.example` - Template for required variables
- Environment-specific configs in `infrastructure/compose/`

**Key Variables:**
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - Auth callback URL
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection
- `STORAGE_TYPE` - 'local' or 'minio'
- `AI_PROVIDER` - 'ollama' or 'openai'
- `OLLAMA_URL`, `OLLAMA_MODEL` - Local LLM config
- `OPENAI_API_KEY` - OpenAI API credentials
- `MEILISEARCH_URL`, `MEILISEARCH_KEY` - Search config
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - Storage config

**Build:**
- `tsconfig.json` - Root TypeScript configuration
- `tsconfig.json` per package (web, workers, shared)
- `next.config.js` - Next.js build configuration at `apps/web/`
- `jest.config.js` - Jest test configuration at `apps/web/`
- `tailwind.config.ts` - Tailwind CSS configuration at `apps/web/`

## Platform Requirements

**Development:**
- Node.js 20.0.0 or higher
- pnpm 8.0.0 or higher
- Docker and Docker Compose (for services)
- PostgreSQL 16, Redis 7, MinIO, Meilisearch, Ollama (all containerized)

**Production:**
- Node.js 20+
- PostgreSQL 16+ database
- Redis 7+ for caching and job queue
- MinIO or S3-compatible storage
- Meilisearch for search
- Optional: Ollama for local LLM, or OpenAI API key for cloud LLM

**Port Mappings (Docker Compose):**
- Next.js App: 3000
- PostgreSQL: 5433 (dev, mapped from 5432)
- Redis: 6379
- MinIO API: 9000
- MinIO Console: 9001
- Meilisearch: 7700
- Ollama: 11434

---

*Stack analysis: 2026-01-22*
