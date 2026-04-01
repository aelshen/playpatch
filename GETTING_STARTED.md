# Getting Started with PlayPatch

## Quick Start (5 Minutes)

### 1. Prerequisites

Ensure you have these installed:
- **Docker Desktop** - [Download](https://www.docker.com/get-started)
  *Must be running before you start*
- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm 8+** - Install: `npm install -g pnpm`

### 2. One-Command Setup

```bash
# Clone and enter directory
git clone <your-repo-url> playpatch
cd playpatch

# Install dependencies
pnpm install

# Start EVERYTHING (web app + workers + all services)
pnpm dev:all
```

**That's it!** This single command:
- ✅ Starts Docker services (PostgreSQL, Redis, MinIO, Meilisearch, Ollama)
- ✅ Waits for services to be ready
- ✅ Creates storage directories
- ✅ Runs database migrations
- ✅ Seeds demo data
- ✅ Starts background workers (video download + transcode)
- ✅ Starts Next.js web application

**First run:** ~2-3 minutes (includes Docker pulls)
**Subsequent runs:** ~30 seconds

### 3. Access the Application

Open http://localhost:3000 and login with:
```
Email:    demo@example.com
Password: password123
```

### 4. Stop Everything

```bash
pnpm dev:stop
```

---

## What's Running?

After `pnpm dev:all`, you have:

### Web Application
- **URL:** http://localhost:3000
- **Process:** Next.js dev server (foreground)
- **Logs:** Visible in your terminal

### Background Workers
- **Processes:** 2 workers running in background
  - Video Download Worker
  - Video Transcode Worker
- **PID File:** `.workers.pid`
- **Logs:** `tail -f .workers.log`

### Docker Services
- **PostgreSQL** - Database (port 5433)
- **Redis** - Cache & job queue (port 6379)
- **MinIO** - S3-compatible storage (ports 9000/9001)
- **Meilisearch** - Search engine (port 7700)
- **Ollama** - Local AI model (port 11434)

---

## Understanding the Workers

### What Do Workers Do?

**Video Download Worker:**
- Downloads videos from YouTube using `yt-dlp`
- Saves to MinIO/S3 storage
- Queues transcode job

**Video Transcode Worker:**
- Converts videos to HLS format
- Creates multiple quality levels (360p, 480p, 720p)
- Generates thumbnails

### Worker Status

```bash
# View worker logs in real-time
tail -f .workers.log

# Check if workers are running
ps aux | grep tsx.*worker

# Worker PID is stored in .workers.pid
cat .workers.pid
```

### Worker Lifecycle

Workers are automatically managed by `pnpm dev:all` and `pnpm dev:stop`:

- **Started by:** `pnpm dev:all`
- **Run in background:** Yes (using nohup)
- **Logs to:** `.workers.log`
- **Stopped by:** `pnpm dev:stop`

---

## Development Workflow

### Daily Development

```bash
# Morning: Start everything
pnpm dev:all

# Work on your features...
# The web app runs in foreground
# Workers run in background

# Evening: Stop everything
pnpm dev:stop
```

### Working Without Workers

If you don't need video processing:

```bash
# Start just Docker services
pnpm docker:dev

# Start just the web app
cd apps/web
pnpm dev
```

### Working on Workers Only

```bash
# Make sure Docker services are running
pnpm docker:dev

# Start workers in foreground (for debugging)
cd packages/workers
pnpm dev
```

---

## Common Commands

### Start/Stop
```bash
pnpm dev:all         # Start everything (recommended)
pnpm dev:stop        # Stop everything gracefully
pnpm dev             # Just web app (no workers)
pnpm workers:dev     # Just workers (for debugging)
```

### Docker Services
```bash
pnpm docker:dev      # Start Docker services
pnpm docker:stop     # Stop Docker services
pnpm docker:restart  # Restart Docker services
pnpm docker:logs     # View all service logs
pnpm docker:status   # Check what's running
pnpm docker:clean    # ⚠️  Remove all volumes (deletes data!)
```

### Database
```bash
pnpm db:studio       # Open Prisma Studio (database GUI)
pnpm db:migrate      # Run new migrations
pnpm db:seed         # Re-seed demo data
pnpm db:reset        # ⚠️  Reset database (deletes all data!)
```

### Health Checks
```bash
pnpm health:check    # Verify all services are healthy
pnpm health:api      # Check API health endpoint
```

---

## Troubleshooting

### "Docker is not running"

Start Docker Desktop first, then:
```bash
pnpm dev:all
```

### "Port 3000 already in use"

Kill the conflicting process:
```bash
lsof -ti:3000 | xargs kill -9
pnpm dev:all
```

### "Database connection failed"

Reset and restart:
```bash
pnpm docker:clean
pnpm dev:all
```

### Workers not processing jobs

Check if workers are running:
```bash
ps aux | grep tsx.*worker
tail -f .workers.log
```

Restart workers:
```bash
pnpm dev:stop
pnpm dev:all
```

### Video downloads failing

Ensure `yt-dlp` is installed:
```bash
# macOS
brew install yt-dlp

# Linux
pip install yt-dlp

# Verify
yt-dlp --version
```

### Video transcoding failing

Ensure `ffmpeg` is installed:
```bash
# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg

# Verify
ffmpeg -version
```

### Complete Reset (Nuclear Option)

If everything is broken:
```bash
pnpm docker:clean    # Remove all Docker volumes
pnpm clean           # Remove node_modules
pnpm install         # Reinstall dependencies
pnpm dev:all         # Start fresh
```

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | demo@example.com / password123 |
| **Prisma Studio** | `pnpm db:studio` | - |
| **MinIO Console** | http://localhost:9001 | See .env file |
| **Meilisearch** | http://localhost:7700 | See .env file |

---

## Next Steps

1. ✅ **You're running!** Web app at http://localhost:3000
2. 📹 **Import a video** - Go to Content → Import Video
3. 👨‍👩‍👧‍👦 **Create child profiles** - Set up profiles for your kids
4. 🎨 **Customize** - Configure time limits, age modes, etc.
5. 📚 **Read docs** - Check [README.md](./README.md) for more details

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Web Application                    │
│              (Next.js on port 3000)                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─────────────┬─────────────┬─────────────┐
                 │             │             │             │
        ┌────────▼──────┐ ┌───▼────┐ ┌─────▼─────┐ ┌────▼──────┐
        │   PostgreSQL  │ │ Redis  │ │   MinIO   │ │ Meilisrch │
        │   (Database)  │ │(Queue) │ │ (Storage) │ │  (Search) │
        └───────────────┘ └───┬────┘ └───────────┘ └───────────┘
                              │
                   ┌──────────▼──────────┐
                   │  Background Workers │
                   │  - Video Download   │
                   │  - Video Transcode  │
                   └─────────────────────┘
```

**Data Flow:**
1. User imports video via web app
2. Job added to Redis queue
3. Download worker picks up job
4. Video downloaded, saved to MinIO
5. Transcode job added to queue
6. Transcode worker picks up job
7. HLS files created, saved to MinIO
8. Database updated with video status
9. User can watch video

---

## Environment Variables

Key variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://playpatch:playpatch_dev@localhost:5433/playpatch

# Redis (for BullMQ job queue)
REDIS_URL=redis://localhost:6379

# Storage - can use local filesystem or network location
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage
# Or use network location:
# LOCAL_STORAGE_PATH=/Volumes/DS920/Media/PlayPatch

# MinIO/S3 Storage (alternative to local)
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Search
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>
```

---

## Project Structure

```
playpatch/
├── apps/
│   └── web/                 # Next.js application
│       ├── src/
│       │   ├── app/        # Pages and API routes
│       │   ├── components/ # React components
│       │   ├── lib/        # Utilities and integrations
│       │   └── workers/    # Worker implementations
│       └── prisma/         # Database schema
│
├── packages/
│   ├── workers/            # Worker entry point
│   └── shared/             # Shared utilities
│
└── infrastructure/
    ├── compose/            # Docker Compose files
    └── scripts/            # Setup and dev scripts
```

---

## FAQ

**Q: Do I need to run workers separately?**
A: No! `pnpm dev:all` starts workers automatically.

**Q: How do I know workers are running?**
A: Check `tail -f .workers.log` or run `ps aux | grep tsx.*worker`

**Q: Can I run without Docker?**
A: No, Docker is required for PostgreSQL, Redis, MinIO, and Meilisearch.

**Q: What happens when I press Ctrl+C?**
A: The web app stops, but workers keep running. Use `pnpm dev:stop` to stop everything.

**Q: Where are videos stored?**
A: Based on `LOCAL_STORAGE_PATH` in `.env` (default: `./storage/`). Can be configured to use a network location like `/Volumes/NAS/Media/PlayPatch` for centralized storage.

**Q: How do I debug worker issues?**
A: Run workers in foreground: `cd packages/workers && pnpm dev`

---

**Need more help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue.
