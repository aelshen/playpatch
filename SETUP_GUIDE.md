# SafeStream Kids - Complete Setup Guide
**Step-by-step guide to get SafeStream Kids running**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (TL;DR)](#quick-start-tldr)
3. [Detailed Setup](#detailed-setup)
4. [Services Overview](#services-overview)
5. [Environment Configuration](#environment-configuration)
6. [Verification & Testing](#verification--testing)
7. [Common Issues](#common-issues)
8. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Check Command | Install Link |
|----------|----------------|---------------|--------------|
| **Node.js** | 20.0+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8.0+ | `pnpm --version` | `npm install -g pnpm` |
| **Docker** | 24.0+ | `docker --version` | [docker.com](https://www.docker.com/get-started) |
| **Docker Compose** | 2.0+ | `docker compose version` | Included with Docker Desktop |
| **Git** | 2.0+ | `git --version` | [git-scm.com](https://git-scm.com/) |

### System Requirements

- **RAM:** 8GB minimum, 16GB recommended
- **Disk Space:** 20GB minimum (for videos)
- **OS:** macOS, Linux, or Windows with WSL2

### Optional Tools

- **nvm** - For managing Node.js versions
- **Make** - For using Makefile commands (Linux/macOS)

---

## Quick Start (TL;DR)

For experienced developers who want to get running quickly:

```bash
# 1. Clone and install
git clone <repo-url> safestream-kids
cd safestream-kids
pnpm install

# 2. Setup environment
pnpm setup:env

# 3. Start everything
pnpm dev:all

# 4. Open browser
open http://localhost:3000
```

**That's it!** The `dev:all` command will:
- ✅ Start all Docker services
- ✅ Wait for services to be healthy
- ✅ Run database migrations
- ✅ Seed initial data
- ✅ Start the web app
- ✅ Start background workers

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url> safestream-kids
cd safestream-kids

# Verify you're in the right directory
ls -la
# You should see: apps/, packages/, infrastructure/, etc.
```

### Step 2: Install Node.js Dependencies

```bash
# Install all dependencies (uses pnpm workspaces)
pnpm install

# This will take 2-5 minutes depending on your connection
# You should see: ✓ All dependencies installed
```

**What this does:**
- Installs dependencies for all packages in the monorepo
- Sets up workspace links between packages
- Downloads TypeScript definitions

### Step 3: Setup Environment Variables

**Option A: Automated (Recommended)**
```bash
pnpm setup:env
```

**Option B: Manual**
```bash
# Copy the example file
cp .env.example .env

# Generate a secure secret
openssl rand -base64 32

# Edit .env and paste the secret
nano .env
# Set NEXTAUTH_SECRET=<paste-your-secret-here>
```

**Minimum required changes in `.env`:**
```bash
NEXTAUTH_SECRET=<your-generated-secret>
```

All other defaults will work for local development!

### Step 4: Start Infrastructure Services

**Option A: All services (Recommended)**
```bash
pnpm docker:dev
```

**Option B: Selective services**
```bash
# Only database and Redis (minimal)
docker compose -f infrastructure/compose/docker-compose.yml up -d postgres redis

# Add search and storage
docker compose -f infrastructure/compose/docker-compose.yml up -d meilisearch minio
```

**What starts:**
- 🐘 **PostgreSQL** (port 5433) - Database
- 🔴 **Redis** (port 6379) - Cache & job queue
- 🪣 **MinIO** (port 9000) - S3-compatible storage
- 🔍 **Meilisearch** (port 7700) - Full-text search
- 🤖 **Ollama** (port 11434) - Local AI (optional)

**Wait for services to be ready (~30 seconds):**
```bash
# Check service status
pnpm docker:status

# Or manually
docker compose -f infrastructure/compose/docker-compose.yml ps
```

### Step 5: Database Setup

```bash
# Run migrations (creates all tables)
pnpm db:migrate

# Expected output:
# ✔ Migrations applied successfully
# ✔ 15 tables created

# Seed initial data (optional but recommended)
pnpm db:seed

# Expected output:
# ✔ Created demo family
# ✔ Created admin user
# ✔ Created 2 child profiles
# ✔ Seeded 5 sample videos
```

**What this creates:**
- Database schema (users, videos, profiles, etc.)
- Demo family: `demo@example.com` / `password123`
- 2 child profiles (ages 5 and 8)
- Sample videos for testing

### Step 6: Start the Application

**Option A: Everything at once**
```bash
pnpm dev:all
```
This starts the web app + background workers + watches for changes.

**Option B: Separate terminals (for debugging)**

Terminal 1 - Web App:
```bash
pnpm dev
```

Terminal 2 - Workers:
```bash
pnpm workers:dev
```

Terminal 3 - Tests (optional):
```bash
pnpm test:watch
```

### Step 7: Verify Installation

**Open your browser:**
```
http://localhost:3000
```

**You should see:**
- ✅ SafeStream Kids login page
- ✅ No error messages
- ✅ Login form ready

**Login with demo account:**
- **Email:** `demo@example.com`
- **Password:** `password123`

**Test the health endpoint:**
```bash
curl http://localhost:3000/api/health | jq
```

Expected response:
```json
{
  "overall": "healthy",
  "services": {
    "database": { "healthy": true },
    "redis": { "healthy": true },
    "storage": { "healthy": true },
    "search": { "healthy": true }
  }
}
```

---

## Services Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SafeStream Kids                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Next.js    │    │   Workers    │    │    Tests     │  │
│  │   Web App    │    │  (BullMQ)    │    │    (Jest)    │  │
│  │  Port 3000   │    │  Background  │    │              │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘  │
│         │                   │                                │
├─────────┼───────────────────┼────────────────────────────────┤
│         │                   │                                │
│  ┌──────▼───────────────────▼──────┐                        │
│  │         Docker Services          │                        │
│  ├──────────────────────────────────┤                        │
│  │  • PostgreSQL 16  (5433)        │                        │
│  │  • Redis 7        (6379)        │                        │
│  │  • MinIO          (9000)        │                        │
│  │  • Meilisearch    (7700)        │                        │
│  │  • Ollama         (11434)       │                        │
│  └──────────────────────────────────┘                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Service Details

#### 1. PostgreSQL (Database)
- **Port:** 5433 (not 5432 to avoid conflicts)
- **Purpose:** Stores all application data
- **Data:** Users, videos, watch history, profiles
- **Volume:** `postgres_data` (persisted)
- **Access:** `localhost:5433`

#### 2. Redis (Cache & Queue)
- **Port:** 6379
- **Purpose:** Caching + background job queue
- **Uses:** Session storage, rate limiting, BullMQ
- **Volume:** `redis_data` (persisted)
- **Access:** `redis://localhost:6379`

#### 3. MinIO (Object Storage)
- **Port:** 9000 (API), 9001 (Console)
- **Purpose:** S3-compatible file storage
- **Stores:** Videos, thumbnails, avatars
- **Console:** http://localhost:9001
- **Credentials:** `minio_admin` / `minio_password`
- **Volume:** `minio_data` (persisted)

#### 4. Meilisearch (Search Engine)
- **Port:** 7700
- **Purpose:** Full-text video search
- **Indexes:** Videos, transcripts
- **Console:** http://localhost:7700
- **Master Key:** `master_key_change_me`
- **Volume:** `meilisearch_data` (persisted)

#### 5. Ollama (Optional - AI)
- **Port:** 11434
- **Purpose:** Local LLM for AI chat
- **Model:** Llama 3.1 8B
- **Volume:** `ollama_data` (persisted)
- **Note:** Requires ~10GB disk space

### Service Dependencies

```
Web App depends on:
  ├─ PostgreSQL (critical)
  ├─ Redis (critical)
  ├─ MinIO/Local Storage (needed for video playback)
  ├─ Meilisearch (optional - for search)
  └─ Ollama (optional - for AI features)

Workers depend on:
  ├─ PostgreSQL (critical)
  ├─ Redis (critical)
  └─ MinIO/Local Storage (critical)
```

---

## Environment Configuration

### Required Variables

These **must** be set for the app to work:

```bash
# Authentication secret (CRITICAL)
NEXTAUTH_SECRET=<generate-with-openssl>

# Database connection
DATABASE_URL=postgresql://safestream:safestream_dev@localhost:5433/safestream

# Redis connection
REDIS_URL=redis://localhost:6379
```

### Optional Variables

Defaults work fine, but you can customize:

```bash
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storage (default: local filesystem)
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage

# AI Features (default: Ollama)
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Feature Flags
ENABLE_AI=true
ENABLE_TRANSCRIPTION=true
```

### Production Variables

Additional variables for production deployment:

```bash
NODE_ENV=production
DOMAIN=safestream.yourdomain.com
ACME_EMAIL=admin@yourdomain.com
STORAGE_TYPE=minio
# ... plus SSL/TLS configuration
```

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete reference.

---

## Verification & Testing

### 1. Check Services are Running

```bash
# Quick check
pnpm docker:status

# Detailed check
docker compose -f infrastructure/compose/docker-compose.yml ps

# Expected: All services show "Up" status
```

### 2. Check Database Connection

```bash
# Open Prisma Studio
pnpm db:studio

# Opens at http://localhost:5555
# You should see all tables
```

### 3. Check Redis Connection

```bash
# Using Redis CLI (if installed)
redis-cli -p 6379 ping
# Expected: PONG

# Or using Docker
docker exec -it safestream-redis redis-cli ping
# Expected: PONG
```

### 4. Run Health Checks

```bash
# API health check
curl http://localhost:3000/api/health

# Expected: {"overall":"healthy", ...}

# Or use the script
pnpm health:check
```

### 5. Run Tests

```bash
# Run all tests
pnpm test

# Expected: All tests pass (110+ tests)

# Run with coverage
pnpm test:coverage

# Expected: 70%+ coverage
```

### 6. Test Video Upload

```bash
# Import a test video
pnpm test:import

# This will:
# 1. Import a sample YouTube video
# 2. Download it
# 3. Transcode to HLS
# 4. Store in MinIO/local storage
```

---

## Common Issues

### Issue 1: Port Already in Use

**Error:** `Error: Port 5433 is already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :5433

# Stop the conflicting service
# OR change the port in docker-compose.yml
```

### Issue 2: Services Not Starting

**Error:** `Docker services fail to start`

**Solution:**
```bash
# Check Docker is running
docker ps

# Check logs
docker compose -f infrastructure/compose/docker-compose.yml logs

# Restart services
pnpm docker:restart
```

### Issue 3: Database Migration Fails

**Error:** `Migration failed`

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
pnpm db:reset

# Then migrate again
pnpm db:migrate
```

### Issue 4: NEXTAUTH_SECRET Missing

**Error:** `NEXTAUTH_SECRET is not set`

**Solution:**
```bash
# Generate a secret
openssl rand -base64 32

# Add to .env
echo "NEXTAUTH_SECRET=<paste-generated-secret>" >> .env
```

### Issue 5: Out of Memory (Ollama)

**Error:** `Ollama fails to start - out of memory`

**Solution:**
```bash
# Disable Ollama in docker-compose.dev.yml
# Or allocate more memory to Docker Desktop
# Settings > Resources > Memory > 8GB+
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more issues.

---

## Next Steps

### 1. First-Time User Setup

After logging in with the demo account:

1. **Change Demo Password**
   - Go to Settings > Account
   - Change password from `password123`

2. **Create Child Profiles**
   - Go to Profiles
   - Add your children's profiles
   - Set age-appropriate settings

3. **Import First Videos**
   - Go to Content > Import
   - Paste YouTube URLs
   - Review and approve

### 2. Learn the Application

- **Admin Guide:** [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- **Development Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **API Documentation:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Testing Guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### 3. Development Workflow

```bash
# Daily development flow
pnpm dev:all          # Start everything
pnpm test:watch       # Run tests in watch mode
pnpm db:studio        # Open database viewer

# Make changes to code
# Tests auto-run
# Browser auto-reloads
```

### 4. Production Deployment

Ready to deploy? See:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [SECURITY.md](./SECURITY.md) - Security best practices

---

## Quick Command Reference

### Daily Commands

```bash
# Start development
pnpm dev:all                    # Everything at once
pnpm dev                        # Just web app
pnpm workers:dev                # Just workers

# Testing
pnpm test                       # Run tests
pnpm test:watch                 # Watch mode
pnpm test:coverage              # With coverage

# Database
pnpm db:studio                  # Open Prisma Studio
pnpm db:migrate                 # Run migrations
pnpm db:seed                    # Seed data
pnpm db:reset                   # Reset (caution!)

# Docker
pnpm docker:dev                 # Start all services
pnpm docker:stop                # Stop all services
pnpm docker:restart             # Restart all services
pnpm docker:status              # Check status
pnpm docker:logs                # View logs

# Health Checks
pnpm health:check               # Check all services
pnpm health:db                  # Check database
pnpm health:redis               # Check Redis
```

### Maintenance Commands

```bash
# Clean up
pnpm clean                      # Clean build artifacts
pnpm docker:clean               # Remove Docker volumes
pnpm clean:all                  # Nuclear option

# Updates
pnpm update                     # Update dependencies
pnpm db:generate                # Regenerate Prisma client

# Lint & Format
pnpm lint                       # Run ESLint
pnpm lint:fix                   # Auto-fix issues
pnpm format                     # Format with Prettier
```

---

## Getting Help

### Documentation
- 📚 **Full docs:** `/docs` directory
- 🔍 **Search:** Use Cmd/Ctrl+F in any .md file
- 📖 **Guides:** Setup, Development, Testing, Deployment

### Community
- 💬 **GitHub Issues:** Report bugs or request features
- 📧 **Email:** support@safestream.example.com
- 💡 **Discussions:** GitHub Discussions for questions

### Troubleshooting
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Check service logs: `pnpm docker:logs`
3. Check app logs: `pnpm dev` output
4. Check health: `pnpm health:check`
5. Search GitHub issues

---

## Success Checklist

Before moving on, verify:

- [ ] All prerequisites installed
- [ ] Repository cloned
- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment configured (`.env` created)
- [ ] Docker services running
- [ ] Database migrated
- [ ] Demo data seeded
- [ ] Web app accessible at `localhost:3000`
- [ ] Can login with demo account
- [ ] Health check passes
- [ ] Tests pass

**All checked?** You're ready to develop! 🎉

---

**Need help?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open a GitHub issue.

**Last Updated:** January 10, 2026
