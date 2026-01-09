# SafeStream Kids - Quick Start Guide

Get up and running in minutes! 🚀

## Prerequisites

- **Docker** & **Docker Compose** - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`

## One-Command Setup

From the project root, run:

```bash
pnpm setup
```

This single command will:
- ✅ Create and configure the `.env` file
- ✅ Install all dependencies
- ✅ Start Docker services (PostgreSQL, Redis, MinIO, Meilisearch, Ollama)
- ✅ Set up the database schema
- ✅ Seed with demo data
- ✅ Pull the AI model

**Time:** ~5-10 minutes (depending on internet speed for Ollama model)

## Start Development

After setup completes:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

```
Email:    admin@safestream.local
Password: password123
```

**Demo Child Profiles:**
- **Tara** - 3 years old, Toddler Mode
- **Eddie** - 6 years old, Explorer Mode

## Essential Commands

### Development
```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm status           # Check all services health
```

### Database
```bash
pnpm db:studio        # Open Prisma Studio (GUI for database)
pnpm db:seed          # Re-seed database with demo data
pnpm db:reset         # Reset database to fresh state
pnpm db:push          # Push schema changes to database
```

### Docker Services
```bash
pnpm docker:dev       # Start all services (with logs)
pnpm docker:down      # Stop all services
pnpm docker:logs      # View service logs
pnpm docker:clean     # Stop services and remove volumes
```

### Testing
```bash
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm lint             # Run linting
pnpm type-check       # Type check TypeScript
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | admin@safestream.local / password123 |
| **Prisma Studio** | Run `pnpm db:studio` | - |
| **MinIO Console** | http://localhost:9001 | minio_admin / minio_password |
| **Meilisearch** | http://localhost:7700 | API Key: master_key_change_me |
| **PostgreSQL** | localhost:5433 | safestream / safestream_dev |
| **Redis** | localhost:6379 | No password (dev mode) |
| **Ollama** | http://localhost:11434 | - |

## Project Structure

```
safestream-kids/
├── apps/
│   └── web/              # Next.js web application
│       ├── src/
│       │   ├── app/      # App router pages
│       │   ├── components/
│       │   ├── lib/      # Utilities, actions, queries
│       │   └── middleware.ts
│       ├── prisma/       # Database schema & migrations
│       └── public/
├── packages/
│   └── shared/           # Shared utilities (workspace package)
├── infrastructure/
│   ├── compose/          # Docker Compose files
│   └── scripts/          # Setup & utility scripts
├── .env                  # Central environment config
└── package.json          # Root workspace config
```

## Configuration

All configuration lives in the root `.env` file. Key settings:

- **Database:** PostgreSQL on port 5433 (avoids local conflicts)
- **Redis:** Port 6379 (no auth in dev mode)
- **MinIO:** Ports 9000 (API) and 9001 (Console)
- **AI Provider:** Ollama with llama3.1:8b model

The `apps/web/.env` is a symlink to the root `.env` for consistency.

## Common Workflows

### Adding a New Feature

1. Create your feature branch
2. Make your changes
3. Run `pnpm type-check` and `pnpm lint`
4. Test locally with `pnpm dev`
5. Reset database for clean testing: `pnpm db:reset`

### Updating Database Schema

1. Edit `apps/web/prisma/schema.prisma`
2. Push changes: `pnpm db:push`
3. Update seed data if needed: edit `apps/web/prisma/seed.ts`
4. Re-seed: `pnpm db:seed`

### Testing Video Import

1. Sign in to admin panel
2. Go to Content → Import Video
3. Paste a YouTube URL (kid-friendly!)
4. Videos will be queued for download
5. Check Approval Queue to approve/reject

## Troubleshooting

### Services won't start
```bash
pnpm docker:down        # Stop everything
pnpm docker:clean       # Remove volumes
pnpm setup              # Run setup again
```

### Database connection errors
- Check if port 5433 is in use: `lsof -i :5433`
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check logs: `docker logs safestream-postgres`

### "Cannot find module @safestream/shared"
```bash
pnpm install            # Reinstall dependencies
pnpm db:generate        # Regenerate Prisma client
```

### Port conflicts
If you have local PostgreSQL/Redis:
- PostgreSQL: We use port 5433 (not 5432)
- Redis: We use port 6379 (stop local Redis first)

### Check service health
```bash
pnpm status             # Comprehensive health check
```

## Next Steps

1. ✅ Complete setup with `pnpm setup`
2. ✅ Start dev server with `pnpm dev`
3. ✅ Sign in and explore the admin panel
4. 📹 Import your first YouTube video
5. 👶 Create a child profile
6. 🎬 Approve content and watch!

## Need Help?

- 📚 Check the main README.md for detailed architecture
- 🐛 Report issues on GitHub
- 💬 Join our community discussions

Happy coding! 🎉
