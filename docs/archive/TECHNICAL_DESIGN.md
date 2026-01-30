# SafeStream Kids - Technical Design Document
## Architecture, Infrastructure & Implementation Guide
### Version 1.0 | January 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack Details](#2-technology-stack-details)
3. [Service Breakdown](#3-service-breakdown)
4. [Database Design](#4-database-design)
5. [API Specifications](#5-api-specifications)
6. [Infrastructure & Deployment](#6-infrastructure--deployment)
7. [Local Development Setup](#7-local-development-setup)
8. [Production Deployment](#8-production-deployment)
9. [Security Implementation](#9-security-implementation)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Development Workflow](#11-development-workflow)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │  iOS PWA    │  │ Android PWA │  │   TV App    │        │
│  │  (Next.js)  │  │  (Future)   │  │  (Future)   │  │  (Future)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴───────┬────────┴────────────────┘
                                   │ HTTPS
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GATEWAY LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Traefik / Nginx Reverse Proxy                     │   │
│  │              (SSL Termination, Rate Limiting, Routing)               │   │
│  └─────────────────────────────────┬───────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Next.js Application                           │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Frontend (React/SSR)                         │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │  │  │
│  │  │  │ Child UI    │  │  Admin UI   │  │  Shared Components      │ │  │  │
│  │  │  │ (3 modes)   │  │ (Dashboard) │  │  (Player, etc.)         │ │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                   API Routes (Backend)                          │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │  │
│  │  │  │   Auth   │ │ Content  │ │ Analytics│ │   AI     │          │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │  │
│  │  │  │  Media   │ │  Ingest  │ │  Search  │ │  Users   │          │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Background Workers (BullMQ)                      │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │  │
│  │  │Video Download│ │ Transcoding  │ │Transcription │                  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                  │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │  │
│  │  │ Channel Sync │ │   Cleanup    │ │ Report Gen   │                  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │  │  Meilisearch │    │
│  │  (Primary DB)│  │(Cache/Queue) │  │(Object Store)│  │   (Search)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   yt-dlp     │  │   Whisper    │  │   Ollama     │  │   FFmpeg     │    │
│  │  (Download)  │  │ (Transcribe) │  │    (LLM)     │  │ (Transcode)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Monorepo Structure

```
safestream-kids/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── deploy-staging.yml        # Staging deployment
│   │   └── deploy-production.yml     # Production deployment
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── apps/
│   └── web/                          # Next.js application
│       ├── src/
│       │   ├── app/                  # App Router (Next.js 14+)
│       │   │   ├── (auth)/           # Auth pages (login, etc.)
│       │   │   ├── (child)/          # Child-facing routes
│       │   │   │   ├── home/
│       │   │   │   ├── watch/[id]/
│       │   │   │   ├── search/
│       │   │   │   ├── favorites/
│       │   │   │   ├── playlists/
│       │   │   │   └── ai/
│       │   │   ├── (admin)/          # Parent/admin routes
│       │   │   │   ├── dashboard/
│       │   │   │   ├── content/
│       │   │   │   ├── children/
│       │   │   │   ├── analytics/
│       │   │   │   └── settings/
│       │   │   ├── api/              # API routes
│       │   │   │   ├── auth/
│       │   │   │   ├── admin/
│       │   │   │   ├── child/
│       │   │   │   └── media/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   │
│       │   ├── components/
│       │   │   ├── ui/               # Base UI components (shadcn)
│       │   │   ├── child/            # Child UI components
│       │   │   │   ├── toddler/      # Ages 2-4
│       │   │   │   └── explorer/     # Ages 5-12
│       │   │   ├── admin/            # Admin components
│       │   │   ├── player/           # Video player components
│       │   │   └── shared/           # Shared components
│       │   │
│       │   ├── lib/
│       │   │   ├── db/               # Database client & queries
│       │   │   │   ├── client.ts     # Prisma/Drizzle client
│       │   │   │   ├── schema.ts     # Schema definitions
│       │   │   │   └── queries/      # Query functions
│       │   │   ├── auth/             # Auth utilities
│       │   │   ├── ai/               # AI integration
│       │   │   │   ├── safety.ts     # Safety filters
│       │   │   │   ├── prompts.ts    # System prompts
│       │   │   │   └── client.ts     # LLM client
│       │   │   ├── media/            # Media handling
│       │   │   │   ├── streaming.ts
│       │   │   │   └── thumbnails.ts
│       │   │   ├── search/           # Search utilities
│       │   │   └── utils/            # General utilities
│       │   │
│       │   ├── hooks/                # React hooks
│       │   ├── stores/               # State management (Zustand)
│       │   ├── types/                # TypeScript types
│       │   └── styles/               # Global styles
│       │
│       ├── public/
│       │   ├── icons/
│       │   ├── themes/
│       │   └── sounds/               # UI sounds
│       │
│       ├── prisma/                   # or drizzle/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       │
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── workers/                      # Background job workers
│   │   ├── src/
│   │   │   ├── jobs/
│   │   │   │   ├── video-download.ts
│   │   │   │   ├── video-transcode.ts
│   │   │   │   ├── video-transcribe.ts
│   │   │   │   ├── channel-sync.ts
│   │   │   │   ├── cleanup.ts
│   │   │   │   └── report-generation.ts
│   │   │   ├── queues.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                       # Shared utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   ├── validators/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ai-safety/                    # AI safety module
│       ├── src/
│       │   ├── filters/
│       │   ├── prompts/
│       │   └── classifiers/
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.workers
│   │   └── Dockerfile.ollama
│   │
│   ├── compose/
│   │   ├── docker-compose.yml        # Base compose file
│   │   ├── docker-compose.dev.yml    # Development overrides
│   │   ├── docker-compose.prod.yml   # Production overrides
│   │   └── .env.example
│   │
│   ├── kubernetes/                   # K8s manifests (optional)
│   │   ├── base/
│   │   ├── overlays/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── kustomization.yaml
│   │
│   ├── terraform/                    # Cloud infrastructure (optional)
│   │   ├── modules/
│   │   ├── environments/
│   │   └── main.tf
│   │
│   └── scripts/
│       ├── setup.sh                  # Initial setup script
│       ├── backup.sh                 # Backup script
│       ├── restore.sh                # Restore script
│       └── update.sh                 # Update script
│
├── docs/
│   ├── PRD.md                        # Product Requirements
│   ├── TECHNICAL_DESIGN.md           # This document
│   ├── DEVELOPMENT_CHECKLIST.md      # Implementation checklist
│   ├── API.md                        # API documentation
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── CONTRIBUTING.md
│
├── tests/
│   ├── e2e/                          # End-to-end tests
│   ├── integration/                  # Integration tests
│   └── fixtures/                     # Test fixtures
│
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json                      # Monorepo root
├── pnpm-workspace.yaml
├── turbo.json                        # Turborepo config
└── README.md
```

---

## 2. Technology Stack Details

### 2.1 Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Runtime** | Node.js | 20 LTS | Stability, ecosystem |
| **Language** | TypeScript | 5.x | Type safety, DX |
| **Package Manager** | pnpm | 8.x | Fast, efficient monorepo support |
| **Monorepo Tool** | Turborepo | 1.x | Fast builds, caching |

### 2.2 Frontend Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Next.js 14+ | App Router, SSR, API routes, PWA |
| **UI Library** | React 18+ | Industry standard, ecosystem |
| **Styling** | Tailwind CSS 3.x | Utility-first, fast development |
| **Components** | shadcn/ui | Beautiful, accessible, customizable |
| **Animations** | Framer Motion | Smooth, declarative animations |
| **State** | Zustand | Simple, minimal boilerplate |
| **Forms** | React Hook Form + Zod | Validation, performance |
| **Data Fetching** | TanStack Query | Caching, sync, offline |
| **Video Player** | Video.js or custom | HLS support, customizable |

### 2.3 Backend Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **API** | Next.js API Routes | Unified codebase, edge-ready |
| **ORM** | Prisma or Drizzle | Type-safe queries, migrations |
| **Validation** | Zod | Runtime validation, TypeScript |
| **Auth** | NextAuth.js v5 | Flexible, session-based |
| **Queue** | BullMQ | Redis-backed, reliable |
| **Email** | Resend or Nodemailer | Transactional emails |

### 2.4 Data Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Database** | PostgreSQL 16 | Primary data store |
| **Cache** | Redis 7 | Sessions, cache, queue backend |
| **Object Storage** | MinIO | S3-compatible video storage |
| **Search** | Meilisearch | Fast, typo-tolerant search |

### 2.5 Media Processing

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Download** | yt-dlp | YouTube/video downloading |
| **Transcoding** | FFmpeg | Video processing, HLS |
| **Thumbnails** | FFmpeg + Sharp | Thumbnail generation |
| **Transcription** | Whisper (OpenAI) | Speech-to-text |

### 2.6 AI Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **LLM (Local)** | Ollama + Llama 3.1 | Privacy-preserving AI |
| **LLM (Cloud)** | OpenAI GPT-4 | Higher quality option |
| **Embedding** | Ollama + nomic-embed | Local semantic search |
| **Safety** | Custom filters + LLM | Content moderation |

### 2.7 Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Containers** | Docker | Containerization |
| **Orchestration (Local)** | Docker Compose | Local development/deployment |
| **Orchestration (Cloud)** | Kubernetes / Fly.io / Railway | Production deployment |
| **Reverse Proxy** | Traefik | Routing, SSL, load balancing |
| **SSL** | Let's Encrypt | Free certificates |

---

## 3. Service Breakdown

### 3.1 Web Application Service

**Responsibility**: Serves frontend and API routes

```yaml
Port: 3000
Dependencies:
  - PostgreSQL
  - Redis
  - MinIO
  - Meilisearch

Environment Variables:
  DATABASE_URL: postgres://...
  REDIS_URL: redis://...
  MINIO_ENDPOINT: http://minio:9000
  MINIO_ACCESS_KEY: ...
  MINIO_SECRET_KEY: ...
  MEILISEARCH_URL: http://meilisearch:7700
  MEILISEARCH_KEY: ...
  NEXTAUTH_SECRET: ...
  NEXTAUTH_URL: http://localhost:3000
  OLLAMA_URL: http://ollama:11434
```

### 3.2 Worker Service

**Responsibility**: Background job processing

```yaml
Port: None (headless)
Dependencies:
  - PostgreSQL
  - Redis
  - MinIO
  - yt-dlp (CLI)
  - FFmpeg (CLI)
  - Whisper

Jobs:
  - video-download: Downloads videos from sources
  - video-transcode: Transcodes to HLS format
  - video-transcribe: Generates transcripts
  - channel-sync: Syncs subscribed channels
  - cleanup: Removes old/orphaned files
  - report-generation: Weekly digests
  - thumbnail-generation: Creates thumbnails
```

### 3.3 Database Service (PostgreSQL)

**Responsibility**: Primary data persistence

```yaml
Port: 5432
Data:
  - User accounts
  - Child profiles
  - Video metadata
  - Watch sessions
  - AI conversations
  - Collections/Playlists
  - Settings

Backup Strategy:
  - Daily automated backups
  - 30-day retention
  - Point-in-time recovery
```

### 3.4 Cache Service (Redis)

**Responsibility**: Caching, sessions, job queue

```yaml
Port: 6379
Data:
  - Session tokens
  - API response cache
  - Rate limiting counters
  - BullMQ job queues
  - Real-time presence

Persistence:
  - AOF enabled
  - RDB snapshots
```

### 3.5 Object Storage Service (MinIO)

**Responsibility**: Video and media file storage

```yaml
Port: 9000 (API), 9001 (Console)
Buckets:
  - videos: Original and transcoded videos
  - thumbnails: Video thumbnails
  - avatars: User avatars
  - journals: Video journal drawings

Storage:
  - Configurable retention policies
  - Lifecycle rules for cleanup
```

### 3.6 Search Service (Meilisearch)

**Responsibility**: Fast video search

```yaml
Port: 7700
Indexes:
  - videos: Searchable video metadata
  - transcripts: Full-text transcript search

Features:
  - Typo tolerance
  - Faceted filtering
  - Age-based filtering
```

### 3.7 AI Service (Ollama)

**Responsibility**: Local LLM inference

```yaml
Port: 11434
Models:
  - llama3.1:8b: Primary chat model
  - nomic-embed-text: Embedding model

GPU:
  - Optional but recommended
  - Falls back to CPU
```

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │    Family    │────────<│     User     │────────<│ ChildProfile │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│         │                        │                        │                 │
│         │                        │                        │                 │
│         │                        │                ┌───────┴───────┐        │
│         │                        │                │               │        │
│         │                        │                ▼               ▼        │
│         │                        │         ┌────────────┐  ┌────────────┐  │
│         │                        │         │  Favorite  │  │ Playlist   │  │
│         │                        │         └────────────┘  └────────────┘  │
│         │                        │                │               │        │
│         │                        │                │               │        │
│         │                        │                ▼               ▼        │
│         │                 ┌──────┴──────┐  ┌────────────┐                  │
│         │                 │             │  │            │                  │
│         ▼                 ▼             │  │            │                  │
│  ┌──────────────┐  ┌────────────┐       │  │            │                  │
│  │  Collection  │──│   Video    │<──────┴──┤            │                  │
│  └──────────────┘  └────────────┘          │            │                  │
│                           │                 │            │                  │
│                    ┌──────┴──────┐          │            │                  │
│                    │             │          │            │                  │
│                    ▼             ▼          │            │                  │
│             ┌────────────┐ ┌──────────┐     │            │                  │
│             │WatchSession│ │ Channel  │     │            │                  │
│             └────────────┘ └──────────┘     │            │                  │
│                    │                        │            │                  │
│                    └────────────────────────┼────────────┘                  │
│                                             │                               │
│                                             ▼                               │
│                                      ┌────────────┐                         │
│                                      │AIConversation│                       │
│                                      └────────────┘                         │
│                                             │                               │
│                                             ▼                               │
│                                      ┌────────────┐                         │
│                                      │ AIMessage  │                         │
│                                      └────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Schema Definition (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// FAMILY & USER MODELS
// ============================================

model Family {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  settings  FamilySettings?
  users     User[]
  collections Collection[]
  channels  Channel[]
  videos    Video[]
}

model FamilySettings {
  id        String   @id @default(cuid())
  familyId  String   @unique
  family    Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  
  // Global settings
  defaultAgeRating    AgeRating @default(AGE_7_PLUS)
  allowAI             Boolean   @default(true)
  weeklyDigestEnabled Boolean   @default(true)
  weeklyDigestEmail   String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  familyId  String
  family    Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  
  email     String   @unique
  password  String   // Hashed
  name      String
  role      UserRole @default(ADMIN)
  avatarUrl String?
  
  // For admin users
  childProfiles ChildProfile[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([familyId])
}

enum UserRole {
  ADMIN
  VIEWER // For extended family, etc.
}

model ChildProfile {
  id        String   @id @default(cuid())
  userId    String   // Parent who created this
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name       String
  birthDate  DateTime
  avatarUrl  String?
  pin        String?  // Optional PIN for profile switching
  
  // Settings
  ageRating     AgeRating @default(AGE_4_PLUS)
  uiMode        UIMode    @default(EXPLORER)
  theme         String    @default("space")
  aiEnabled     Boolean   @default(true)
  aiVoiceEnabled Boolean  @default(false)
  
  // Time limits (JSON stored as string)
  timeLimits    Json?
  
  // Allowed categories (null = all)
  allowedCategories String[]
  
  // Relations
  watchSessions   WatchSession[]
  favorites       Favorite[]
  playlists       ChildPlaylist[]
  aiConversations AIConversation[]
  journalEntries  JournalEntry[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}

enum AgeRating {
  AGE_2_PLUS
  AGE_4_PLUS
  AGE_7_PLUS
  AGE_10_PLUS
}

enum UIMode {
  TODDLER    // Ages 2-4
  EXPLORER   // Ages 5-12
}

// ============================================
// CONTENT MODELS
// ============================================

model Video {
  id        String   @id @default(cuid())
  familyId  String
  family    Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  
  // Source
  sourceUrl   String
  sourceType  SourceType
  sourceId    String?    // e.g., YouTube video ID
  channelId   String?
  channel     Channel?   @relation(fields: [channelId], references: [id])
  
  // Local storage
  localPath     String?
  thumbnailPath String?
  hlsPath       String?
  
  // Status
  status         VideoStatus @default(PENDING)
  approvalStatus ApprovalStatus @default(PENDING)
  approvedBy     String?
  approvedAt     DateTime?
  rejectionReason String?
  
  // Metadata
  title         String
  description   String?
  duration      Int         // seconds
  ageRating     AgeRating   @default(AGE_7_PLUS)
  categories    String[]
  topics        String[]    // AI-extracted + manual
  
  // Content analysis
  transcript    String?
  chapters      Json?       // Chapter markers
  
  // Admin notes
  notes         String?
  
  // Flags
  isDownloaded  Boolean @default(false)
  isTranscoded  Boolean @default(false)
  isTranscribed Boolean @default(false)
  
  // Relations
  collections    CollectionVideo[]
  watchSessions  WatchSession[]
  favorites      Favorite[]
  playlistVideos PlaylistVideo[]
  aiConversations AIConversation[]
  journalEntries JournalEntry[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([sourceType, sourceId])
  @@index([familyId])
  @@index([status])
  @@index([approvalStatus])
  @@index([ageRating])
}

enum SourceType {
  YOUTUBE
  VIMEO
  UPLOAD
  OTHER
}

enum VideoStatus {
  PENDING      // Awaiting download
  DOWNLOADING  // Currently downloading
  PROCESSING   // Transcoding/processing
  READY        // Available for viewing
  ERROR        // Failed processing
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model Channel {
  id        String   @id @default(cuid())
  familyId  String
  family    Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  
  sourceId    String     // YouTube channel ID, etc.
  sourceType  SourceType
  name        String
  description String?
  thumbnailUrl String?
  
  // Sync settings
  syncMode      SyncMode  @default(REVIEW)
  syncFrequency SyncFrequency @default(DAILY)
  autoAgeRating AgeRating?
  autoCategories String[]
  
  // Selective rules (JSON)
  selectiveRules Json?
  
  lastSyncAt    DateTime?
  nextSyncAt    DateTime?
  
  // Relations
  videos Video[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([familyId, sourceType, sourceId])
  @@index([familyId])
}

enum SyncMode {
  AUTO_APPROVE  // New videos go directly to library
  REVIEW        // New videos go to approval queue
  SELECTIVE     // Apply rules to filter
}

enum SyncFrequency {
  HOURLY
  DAILY
  WEEKLY
  MANUAL
}

model Collection {
  id        String   @id @default(cuid())
  familyId  String
  family    Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  
  name          String
  description   String?
  thumbnailPath String?
  type          CollectionType @default(MANUAL)
  
  // Smart playlist rules (JSON)
  smartRules    Json?
  
  // Visibility
  visibility    CollectionVisibility @default(ALL)
  visibleToAges AgeRating[]
  visibleToIds  String[]  // Child profile IDs
  
  // Relations
  videos CollectionVideo[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([familyId])
}

enum CollectionType {
  MANUAL
  SMART
}

enum CollectionVisibility {
  ALL
  SPECIFIC_AGES
  SPECIFIC_CHILDREN
}

model CollectionVideo {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  videoId      String
  video        Video      @relation(fields: [videoId], references: [id], onDelete: Cascade)
  position     Int        @default(0)
  
  createdAt DateTime @default(now())
  
  @@unique([collectionId, videoId])
  @@index([collectionId])
  @@index([videoId])
}

// ============================================
// CHILD ACTIVITY MODELS
// ============================================

model WatchSession {
  id        String   @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  videoId   String
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  startedAt    DateTime @default(now())
  endedAt      DateTime?
  duration     Int      @default(0) // seconds watched
  lastPosition Int      @default(0) // seconds
  completed    Boolean  @default(false)
  
  // Device info
  deviceType   String?
  deviceId     String?
  userAgent    String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([childId])
  @@index([videoId])
  @@index([startedAt])
}

model Favorite {
  id        String   @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  videoId   String
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([childId, videoId])
  @@index([childId])
  @@index([videoId])
}

model ChildPlaylist {
  id        String   @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  
  videos PlaylistVideo[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([childId])
}

model PlaylistVideo {
  id         String @id @default(cuid())
  playlistId String
  playlist   ChildPlaylist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  videoId    String
  video      Video  @relation(fields: [videoId], references: [id], onDelete: Cascade)
  position   Int    @default(0)
  
  createdAt DateTime @default(now())
  
  @@unique([playlistId, videoId])
  @@index([playlistId])
  @@index([videoId])
}

// ============================================
// AI MODELS
// ============================================

model AIConversation {
  id        String   @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  videoId   String
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  startedAt  DateTime @default(now())
  endedAt    DateTime?
  
  // Extracted topics discussed
  topics     String[]
  
  // Safety flags
  flags      Json?    // Array of { type, message, timestamp }
  hasFlags   Boolean  @default(false)
  
  messages AIMessage[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([childId])
  @@index([videoId])
  @@index([hasFlags])
  @@index([startedAt])
}

model AIMessage {
  id             String @id @default(cuid())
  conversationId String
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  role    AIRole
  content String
  
  // If filtered, store original
  wasFiltered     Boolean @default(false)
  originalContent String?
  
  // Processing metadata
  processingTime  Int?    // ms
  tokenCount      Int?
  
  createdAt DateTime @default(now())
  
  @@index([conversationId])
}

enum AIRole {
  CHILD
  ASSISTANT
  SYSTEM
}

// ============================================
// JOURNAL MODELS
// ============================================

model JournalEntry {
  id        String   @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  videoId   String
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  // Entry types
  voiceNoteUrl   String?
  voiceNoteText  String?  // Transcribed
  drawingUrl     String?
  textNote       String?
  rating         Int?     // 1-5 stars
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([childId])
  @@index([videoId])
}

// ============================================
// SYSTEM MODELS
// ============================================

model BackgroundJob {
  id        String   @id @default(cuid())
  type      String
  status    JobStatus @default(PENDING)
  payload   Json
  result    Json?
  error     String?
  attempts  Int      @default(0)
  
  createdAt   DateTime  @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  
  @@index([type])
  @@index([status])
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

### 4.3 Indexes and Optimization

```sql
-- Additional indexes for common queries

-- Video search
CREATE INDEX idx_videos_search ON videos 
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Analytics queries
CREATE INDEX idx_watch_sessions_analytics ON watch_sessions (child_id, started_at DESC);
CREATE INDEX idx_watch_sessions_daily ON watch_sessions (DATE(started_at), child_id);

-- Content filtering
CREATE INDEX idx_videos_age_approval ON videos (age_rating, approval_status);
```

---

## 5. API Specifications

### 5.1 Authentication API

```typescript
// POST /api/auth/login
// Request
{
  email: string;
  password: string;
}
// Response
{
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    familyId: string;
    role: "ADMIN" | "VIEWER";
  }
}

// POST /api/auth/child-select
// Request
{
  childId: string;
  pin?: string;
}
// Response
{
  childToken: string;
  child: ChildProfile;
}

// POST /api/auth/logout
// No body
// Response: { success: true }
```

### 5.2 Admin Content API

```typescript
// GET /api/admin/videos
// Query params: page, limit, status, approvalStatus, ageRating, search
// Response
{
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}

// POST /api/admin/videos/import
// Request
{
  url: string;
  ageRating?: AgeRating;
  categories?: string[];
  autoApprove?: boolean;
}
// Response
{
  jobId: string;
  status: "queued";
}

// PATCH /api/admin/videos/:id
// Request
{
  title?: string;
  description?: string;
  ageRating?: AgeRating;
  categories?: string[];
  topics?: string[];
  notes?: string;
}
// Response: Updated Video

// POST /api/admin/videos/:id/approve
// Request
{
  ageRating?: AgeRating;
  categories?: string[];
}
// Response: { success: true, video: Video }

// POST /api/admin/videos/:id/reject
// Request
{
  reason?: string;
}
// Response: { success: true }

// DELETE /api/admin/videos/:id
// Query params: deleteFiles?: boolean
// Response: { success: true }
```

### 5.3 Child API

```typescript
// GET /api/child/home
// Response
{
  continueWatching: VideoWithProgress[];
  collections: Collection[];
  forYou: Video[];
  recentFavorites: Video[];
}

// GET /api/child/videos
// Query params: category, topic, page, limit
// Response
{
  videos: Video[];
  pagination: Pagination;
}

// GET /api/child/videos/:id
// Response
{
  video: Video;
  related: Video[];
  isFavorite: boolean;
  lastPosition: number;
}

// GET /api/child/search
// Query params: q, category, duration, page
// Response
{
  results: Video[];
  suggestions: string[];
  pagination: Pagination;
}

// POST /api/child/watch/start
// Request
{
  videoId: string;
  deviceInfo?: { type: string; id: string };
}
// Response
{
  sessionId: string;
  remainingTime?: number; // If time limits enabled
}

// POST /api/child/watch/heartbeat
// Request
{
  sessionId: string;
  position: number;
}
// Response
{
  remainingTime?: number;
  shouldStop?: boolean;
  message?: string;
}

// POST /api/child/watch/end
// Request
{
  sessionId: string;
  position: number;
  completed: boolean;
}
// Response: { success: true }

// POST /api/child/favorites
// Request: { videoId: string }
// Response: { success: true }

// DELETE /api/child/favorites/:videoId
// Response: { success: true }
```

### 5.4 AI Chat API

```typescript
// POST /api/child/ai/chat
// Request
{
  videoId: string;
  conversationId?: string; // Continue existing or start new
  message: string;
}
// Response
{
  conversationId: string;
  response: string;
  suggestions?: string[]; // Follow-up suggestions
  relatedVideos?: Video[]; // "Learn more" videos
}

// GET /api/child/ai/history/:videoId
// Response
{
  conversations: {
    id: string;
    startedAt: string;
    messageCount: number;
    topics: string[];
  }[];
}
```

### 5.5 Analytics API (Admin)

```typescript
// GET /api/admin/analytics/overview
// Query params: startDate, endDate
// Response
{
  summary: {
    totalWatchTime: number;
    totalVideos: number;
    totalAiChats: number;
    alertCount: number;
  };
  children: {
    id: string;
    name: string;
    watchTime: number;
    changeFromPrevious: number;
    topCategory: string;
    aiChats: number;
  }[];
  categoryBreakdown: { category: string; minutes: number; percentage: number }[];
  dailyUsage: { date: string; minutes: number }[];
}

// GET /api/admin/analytics/child/:childId
// Query params: startDate, endDate
// Response
{
  summary: {
    watchTime: number;
    sessions: number;
    videosWatched: number;
    favoritesAdded: number;
    aiConversations: number;
    questionsAsked: number;
  };
  viewingPatterns: {
    dayOfWeek: number;
    hour: number;
    minutes: number;
  }[];
  interests: {
    topic: string;
    score: number;
    trend: "rising" | "stable" | "falling";
  }[];
  topVideos: {
    video: Video;
    views: number;
    totalTime: number;
    hasAiChat: boolean;
  }[];
  insights: string[];
}

// GET /api/admin/analytics/child/:childId/ai
// Query params: page, limit, hasFlags
// Response
{
  conversations: {
    id: string;
    videoTitle: string;
    startedAt: string;
    messageCount: number;
    topics: string[];
    hasFlags: boolean;
  }[];
  questionThemes: { theme: string; count: number }[];
  pagination: Pagination;
}

// GET /api/admin/analytics/conversation/:conversationId
// Response
{
  conversation: AIConversation;
  messages: AIMessage[];
  video: Video;
  child: ChildProfile;
}
```

---

## 6. Infrastructure & Deployment

### 6.1 Docker Compose (Development & Local Production)

```yaml
# docker-compose.yml - Base configuration

version: '3.8'

services:
  # Main web application
  web:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.web
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - DATABASE_URL=postgres://safestream:${DB_PASSWORD}@postgres:5432/safestream
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MEILISEARCH_URL=http://meilisearch:7700
      - MEILISEARCH_KEY=${MEILISEARCH_KEY}
      - OLLAMA_URL=http://ollama:11434
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_started
    volumes:
      - ./apps/web:/app/apps/web
      - web_node_modules:/app/apps/web/node_modules
    networks:
      - safestream

  # Background workers
  workers:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.workers
    environment:
      - DATABASE_URL=postgres://safestream:${DB_PASSWORD}@postgres:5432/safestream
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - OLLAMA_URL=http://ollama:11434
      - WHISPER_MODEL=${WHISPER_MODEL:-base}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - video_processing:/tmp/processing
    networks:
      - safestream

  # PostgreSQL database
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=safestream
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=safestream
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U safestream"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - safestream

  # Redis cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - safestream

  # MinIO object storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    networks:
      - safestream

  # Meilisearch
  meilisearch:
    image: getmeili/meilisearch:v1.6
    environment:
      - MEILI_MASTER_KEY=${MEILISEARCH_KEY}
    volumes:
      - meilisearch_data:/meili_data
    networks:
      - safestream

  # Ollama for local LLM
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    networks:
      - safestream

volumes:
  postgres_data:
  redis_data:
  minio_data:
  meilisearch_data:
  ollama_data:
  video_processing:
  web_node_modules:

networks:
  safestream:
    driver: bridge
```

```yaml
# docker-compose.dev.yml - Development overrides

version: '3.8'

services:
  web:
    command: pnpm dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development

  postgres:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"

  minio:
    ports:
      - "9000:9000"
      - "9001:9001"

  meilisearch:
    ports:
      - "7700:7700"

  ollama:
    ports:
      - "11434:11434"
```

```yaml
# docker-compose.prod.yml - Production overrides

version: '3.8'

services:
  # Traefik reverse proxy
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - safestream

  web:
    command: pnpm start
    environment:
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=3000"
      # Redirect HTTP to HTTPS
      - "traefik.http.routers.web-http.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.web-http.entrypoints=web"
      - "traefik.http.routers.web-http.middlewares=https-redirect"
      - "traefik.http.middlewares.https-redirect.redirectscheme.scheme=https"
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  workers:
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

  postgres:
    deploy:
      restart_policy:
        condition: on-failure

volumes:
  letsencrypt:
```

### 6.2 Cloud Deployment Options

#### Option A: Single VPS (Recommended for Home Use)

```
┌──────────────────────────────────────────────────────────────┐
│                    VPS (4GB+ RAM)                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Docker Compose                         │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │  All services running in containers             │   │  │
│  │  │  - Traefik for SSL/routing                      │   │  │
│  │  │  - Web app (Next.js)                            │   │  │
│  │  │  - Workers                                      │   │  │
│  │  │  - PostgreSQL                                   │   │  │
│  │  │  - Redis                                        │   │  │
│  │  │  - MinIO                                        │   │  │
│  │  │  - Meilisearch                                  │   │  │
│  │  │  - Ollama (optional, CPU mode)                  │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  External: Domain + Let's Encrypt SSL                        │
└──────────────────────────────────────────────────────────────┘

Providers: Hetzner, DigitalOcean, Linode, Vultr
Cost: ~$20-40/month
```

#### Option B: Cloud Platform (Fly.io / Railway / Render)

```
┌──────────────────────────────────────────────────────────────┐
│                        Cloud Platform                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Web App   │  │   Workers   │  │   Ollama    │          │
│  │  (Managed)  │  │  (Managed)  │  │  (GPU VM)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ PostgreSQL  │  │    Redis    │  │ S3/R2/B2   │          │
│  │  (Managed)  │  │  (Managed)  │  │  (Storage)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Providers: Fly.io, Railway, Render
Cost: ~$30-100/month depending on usage
```

#### Option C: Home Server with Cloudflare Tunnel

```
┌──────────────────────────────────────────────────────────────┐
│                        Cloudflare                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Cloudflare Tunnel (Zero Trust)                 │ │
│  │           - No port forwarding needed                    │ │
│  │           - DDoS protection                              │ │
│  │           - SSL termination                              │ │
│  └────────────────────────┬────────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────────┘
                            │ Encrypted tunnel
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      Home Server                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Docker Compose (same as VPS)                │ │
│  │              + cloudflared container                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Hardware: Old PC, Raspberry Pi 5, Intel NUC, Mini PC        │
│  Cost: Electricity only + Cloudflare (free tier available)   │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Environment Variables

```bash
# .env.example

# ===================
# Database
# ===================
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgres://safestream:${DB_PASSWORD}@postgres:5432/safestream

# ===================
# Redis
# ===================
REDIS_URL=redis://redis:6379

# ===================
# MinIO / S3
# ===================
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key
MINIO_BUCKET_VIDEOS=videos
MINIO_BUCKET_THUMBNAILS=thumbnails

# For production S3
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_REGION=us-east-1
# S3_ACCESS_KEY=aws_access_key
# S3_SECRET_KEY=aws_secret_key

# ===================
# Meilisearch
# ===================
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_KEY=your_master_key

# ===================
# Ollama / AI
# ===================
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b

# Or use OpenAI
# OPENAI_API_KEY=sk-...
# AI_PROVIDER=openai

# ===================
# Auth
# ===================
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

# ===================
# App
# ===================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===================
# Production Only
# ===================
DOMAIN=safestream.yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# ===================
# Email (Optional)
# ===================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
EMAIL_FROM=SafeStream <noreply@yourdomain.com>

# ===================
# Whisper
# ===================
WHISPER_MODEL=base  # tiny, base, small, medium, large
```

---

## 7. Local Development Setup

### 7.1 Prerequisites

```bash
# Required software
- Docker Desktop (or Docker Engine + Docker Compose)
- Node.js 20+ (via nvm recommended)
- pnpm 8+
- Git

# Recommended
- VS Code with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
  - Docker
```

### 7.2 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourorg/safestream-kids.git
cd safestream-kids

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your values (generate secrets!)

# 4. Start infrastructure services
docker compose -f infrastructure/compose/docker-compose.yml \
               -f infrastructure/compose/docker-compose.dev.yml \
               up -d postgres redis minio meilisearch

# 5. Run database migrations
pnpm db:migrate

# 6. Seed initial data (optional)
pnpm db:seed

# 7. Start development server
pnpm dev

# 8. Open browser
open http://localhost:3000
```

### 7.3 Development Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "playwright test",
    
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    
    "docker:dev": "docker compose -f infrastructure/compose/docker-compose.yml -f infrastructure/compose/docker-compose.dev.yml up",
    "docker:prod": "docker compose -f infrastructure/compose/docker-compose.yml -f infrastructure/compose/docker-compose.prod.yml up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",
    
    "workers:dev": "tsx watch packages/workers/src/index.ts",
    
    "ollama:pull": "docker exec -it safestream-ollama ollama pull llama3.1:8b"
  }
}
```

---

## 8. Production Deployment

### 8.1 Single VPS Deployment

```bash
#!/bin/bash
# infrastructure/scripts/deploy.sh

set -e

# Configuration
REPO_URL="https://github.com/yourorg/safestream-kids.git"
DEPLOY_DIR="/opt/safestream"
BRANCH="${1:-main}"

echo "🚀 Deploying SafeStream Kids..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Clone or update repository
if [ -d "$DEPLOY_DIR" ]; then
    cd $DEPLOY_DIR
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    sudo git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
    git checkout $BRANCH
fi

# Copy environment if not exists
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env
    echo "⚠️  Please edit .env file with your configuration"
    exit 1
fi

# Build and deploy
cd $DEPLOY_DIR/infrastructure/compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose exec web pnpm db:migrate:prod

# Initialize Meilisearch indexes
docker compose exec web pnpm search:init

echo "✅ Deployment complete!"
echo "🌐 Access your app at https://${DOMAIN}"
```

### 8.2 Backup Script

```bash
#!/bin/bash
# infrastructure/scripts/backup.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups/safestream}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

mkdir -p $BACKUP_PATH

echo "📦 Starting backup..."

# Backup PostgreSQL
docker compose exec -T postgres pg_dump -U safestream safestream | gzip > $BACKUP_PATH/postgres.sql.gz

# Backup Redis
docker compose exec -T redis redis-cli BGSAVE
docker cp $(docker compose ps -q redis):/data/dump.rdb $BACKUP_PATH/redis.rdb

# Backup MinIO data (optional - can be large)
if [ "$BACKUP_VIDEOS" = "true" ]; then
    docker run --rm -v minio_data:/data -v $BACKUP_PATH:/backup alpine tar czf /backup/minio.tar.gz /data
fi

# Backup environment file
cp .env $BACKUP_PATH/.env.backup

# Create manifest
echo "backup_date: $DATE" > $BACKUP_PATH/manifest.yml
echo "postgres: postgres.sql.gz" >> $BACKUP_PATH/manifest.yml
echo "redis: redis.rdb" >> $BACKUP_PATH/manifest.yml
[ "$BACKUP_VIDEOS" = "true" ] && echo "minio: minio.tar.gz" >> $BACKUP_PATH/manifest.yml

# Cleanup old backups (keep last 7)
ls -dt $BACKUP_DIR/*/ | tail -n +8 | xargs rm -rf

echo "✅ Backup complete: $BACKUP_PATH"
```

### 8.3 Update Script

```bash
#!/bin/bash
# infrastructure/scripts/update.sh

set -e

cd /opt/safestream

echo "🔄 Updating SafeStream Kids..."

# Create backup first
./infrastructure/scripts/backup.sh

# Pull latest changes
git pull origin main

# Pull new images
cd infrastructure/compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Recreate containers with new images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose exec web pnpm db:migrate:prod

# Cleanup old images
docker image prune -f

echo "✅ Update complete!"
```

---

## 9. Security Implementation

### 9.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PARENT LOGIN                                                               │
│  ────────────                                                               │
│  1. Parent enters email + password                                          │
│  2. Server validates credentials (bcrypt compare)                           │
│  3. Server creates session in database                                      │
│  4. Server sets httpOnly cookie with session ID                             │
│  5. Server returns user data + family info                                  │
│                                                                             │
│  CHILD PROFILE SELECTION                                                    │
│  ───────────────────────                                                    │
│  1. Parent selects child profile                                            │
│  2. If PIN required, validate PIN                                           │
│  3. Server creates child session (linked to parent session)                 │
│  4. Server sets childSessionId in cookie                                    │
│  5. UI switches to child mode                                               │
│                                                                             │
│  REQUEST AUTHENTICATION                                                     │
│  ──────────────────────                                                     │
│  1. Middleware extracts session ID from cookie                              │
│  2. Validate session in database/Redis                                      │
│  3. Check session expiry                                                    │
│  4. For child routes: validate childSessionId                               │
│  5. Attach user/child to request context                                    │
│                                                                             │
│  CHILD SESSION LIMITS                                                       │
│  ───────────────────                                                        │
│  - Child sessions expire after inactivity (configurable)                    │
│  - Child sessions bound to device (optional)                                │
│  - Parent can remotely terminate child sessions                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Security Checklist

```markdown
## Authentication & Sessions
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] Sessions stored server-side (database or Redis)
- [ ] HttpOnly, Secure, SameSite cookies
- [ ] Session rotation on privilege change
- [ ] Rate limiting on login attempts
- [ ] Account lockout after failed attempts

## API Security
- [ ] All endpoints require authentication
- [ ] Role-based access control (RBAC)
- [ ] Input validation with Zod
- [ ] Output sanitization
- [ ] Rate limiting per user/IP
- [ ] Request size limits

## Data Security
- [ ] Database encrypted at rest
- [ ] TLS for all connections
- [ ] Secrets in environment variables
- [ ] No sensitive data in logs
- [ ] PII data encryption

## Content Security
- [ ] All videos pre-approved
- [ ] No external links in descriptions
- [ ] Sanitized HTML in all displays
- [ ] CSP headers configured
- [ ] XSS protection

## AI Safety
- [ ] Input filtering before LLM
- [ ] Output filtering after LLM
- [ ] Conversation logging
- [ ] Alert system for concerning content
- [ ] Rate limiting on AI requests
- [ ] Token limits per conversation

## Infrastructure
- [ ] Firewall configured
- [ ] SSH key-only access
- [ ] Regular security updates
- [ ] Automated backups
- [ ] DDoS protection (Cloudflare/Traefik)
```

---

## 10. Monitoring & Observability

### 10.1 Logging

```typescript
// Using Pino for structured logging

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' }
    : undefined,
  redact: ['password', 'pin', 'sessionId', 'token'],
});

// Usage
logger.info({ videoId, userId }, 'Video import started');
logger.error({ err, jobId }, 'Job failed');
```

### 10.2 Health Checks

```typescript
// /api/health/route.ts

export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkMinio(),
    checkMeilisearch(),
    checkOllama(),
  ]);
  
  const results = {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: checks[0].status === 'fulfilled' ? 'up' : 'down',
      redis: checks[1].status === 'fulfilled' ? 'up' : 'down',
      storage: checks[2].status === 'fulfilled' ? 'up' : 'down',
      search: checks[3].status === 'fulfilled' ? 'up' : 'down',
      ai: checks[4].status === 'fulfilled' ? 'up' : 'down',
    },
  };
  
  return Response.json(results, {
    status: results.status === 'healthy' ? 200 : 503,
  });
}
```

### 10.3 Metrics (Optional)

```yaml
# Prometheus + Grafana stack (optional addition to docker-compose)

prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus

grafana:
  image: grafana/grafana:latest
  volumes:
    - grafana_data:/var/lib/grafana
  ports:
    - "3001:3000"
```

---

## 11. Development Workflow

### 11.1 Git Workflow

```
main (production)
  │
  └── develop (staging)
        │
        ├── feature/SSK-001-video-player
        ├── feature/SSK-002-ai-chat
        ├── fix/SSK-003-time-limit-bug
        └── ...

Merge flow:
feature/* → develop → main (release)
```

### 11.2 Commit Convention

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Adding tests
- chore: Maintenance

Examples:
feat(player): add chapter markers support
fix(ai): prevent empty responses
docs(api): update auth endpoints
```

### 11.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build
      
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: ./deploy.sh staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: ./deploy.sh production
```

---

## Appendix A: Dockerfiles

### Dockerfile.web

```dockerfile
# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "apps/web/server.js"]
```

### Dockerfile.workers

```dockerfile
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    git

# Install yt-dlp
RUN pip3 install --break-system-packages yt-dlp

# Install Whisper (optional - for local transcription)
# RUN pip3 install openai-whisper

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/workers/package.json ./packages/workers/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/workers/node_modules ./packages/workers/node_modules
COPY packages/workers ./packages/workers
COPY packages/shared ./packages/shared

WORKDIR /app/packages/workers
CMD ["node", "dist/index.js"]
```

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial technical design |
| 1.1 | January 2026 | Simplified UIMode enum from 3 to 2 modes (Toddler, Explorer). Explorer now covers ages 5-12. |

---

*This document should be updated as architectural decisions evolve.*
