# SafeStream Kids - Quick Start Guide

## 🎉 Phase 1 Foundation Complete!

All infrastructure and core setup is now in place. Follow these steps to get started.

## Prerequisites

- **Node.js** 20+ installed
- **pnpm** 8+ installed (`npm install -g pnpm`)
- **Docker** and **Docker Compose** installed
- **Git** installed

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure Services

```bash
# Option A: Use the helper script
./infrastructure/scripts/dev-start.sh

# Option B: Manual start
cd infrastructure/compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
cd ../..
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (ports 9000, 9001)
- Meilisearch (port 7700)
- Ollama (port 11434)

### 3. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Generate auth secret
openssl rand -base64 32
# Copy the output and paste it as NEXTAUTH_SECRET in .env
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

### 5. Seed Demo Data (Optional)

```bash
pnpm db:seed
```

This creates:
- Demo admin user: `admin@safestream.local` / `password123`
- Two child profiles: Tara (3yo, Toddler) and Eddie (6yo, Explorer)
- Sample collections

### 6. Pull Ollama AI Model (Optional)

```bash
pnpm ollama:pull
```

This downloads the Llama 3.1 8B model (~4.7GB). Skip if not using AI features yet.

### 7. Start Development Server

```bash
pnpm dev
```

### 8. Open in Browser

Visit: http://localhost:3000

## Verification

Check that all services are running:

```bash
# Check Docker services
docker compose -f infrastructure/compose/docker-compose.yml ps

# Check Next.js dev server
curl http://localhost:3000/api/health
```

## Available Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **App** | http://localhost:3000 | admin@safestream.local / password123 |
| **MinIO Console** | http://localhost:9001 | minio_admin / minio_password |
| **Meilisearch** | http://localhost:7700 | Key: master_key_change_me |
| **Prisma Studio** | `pnpm db:studio` | - |

## Common Commands

```bash
# Development
pnpm dev                  # Start Next.js dev server
pnpm build                # Build for production
pnpm lint                 # Run linter
pnpm type-check           # Type check

# Database
pnpm db:migrate          # Run migrations
pnpm db:generate         # Generate Prisma client
pnpm db:push             # Push schema to DB (dev only)
pnpm db:studio           # Open Prisma Studio
pnpm db:seed             # Seed demo data

# Docker
pnpm docker:dev          # Start all services
pnpm docker:down         # Stop all services
pnpm docker:logs         # View logs
pnpm docker:clean        # Stop and remove volumes

# Workers (when ready)
pnpm workers:dev         # Start background workers
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # or :5432, :6379, etc.

# Kill the process or change the port in .env
```

### Docker Services Won't Start

```bash
# Check Docker is running
docker info

# Restart Docker services
pnpm docker:down
pnpm docker:dev
```

### Database Connection Error

```bash
# Make sure PostgreSQL is running
docker ps | grep postgres

# Check DATABASE_URL in .env matches Docker settings
```

### Prisma Client Not Found

```bash
# Generate Prisma client
pnpm db:generate
```

## What's Next?

You're now ready to start building! Check out:

- **DEVELOPMENT_CHECKLIST.md** - All implementation tickets
- **TECHNICAL_DESIGN.md** - Complete technical specification
- **PRD.md** - Product requirements and features

### Recommended Next Steps

1. **SSK-021**: Implement authentication with NextAuth.js
2. **SSK-036**: Create video CRUD operations
3. **SSK-071**: Build child-facing UI components

## Need Help?

- Check the documentation in `/docs`
- Review existing code structure
- Open an issue on GitHub

---

**Happy coding!** 🚀
