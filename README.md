# PlayPatch

A self-hosted, parent-controlled video streaming platform designed to provide children with a safe, curated video experience.

## 🌟 Features

- **Complete Content Control**: 100% parent-approved content before viewing
- **AI-Assisted Learning**: Safe, monitored AI chat for answering children's questions
- **Comprehensive Analytics**: Deep insights into viewing habits and interests
- **Time Management**: Built-in limits, break reminders, and bedtime mode
- **Age-Adaptive UI**: Interfaces optimized for toddlers (2-4) and explorers (5-12)
- **Privacy-First**: Fully self-hosted with no external tracking

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker Desktop** ([Download](https://www.docker.com/get-started))
- **Git**

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/playpatch.git
cd playpatch

# Install dependencies
pnpm install

# Start everything (this does it all!)
pnpm dev:all
```

**What `pnpm dev:all` does:**
1. ✓ Starts Docker services (PostgreSQL, Redis, MinIO, Meilisearch, Ollama)
2. ✓ Waits for services to be ready
3. ✓ Creates storage directories
4. ✓ Runs database migrations
5. ✓ Seeds demo data (if database is empty)
6. ✓ Starts background workers
7. ✓ Starts web application

**First-time setup takes:** ~2-3 minutes
**Subsequent starts take:** ~30 seconds

### Access the Application

Once started, open http://localhost:3000 and login with:
- **Email:** `demo@example.com`
- **Password:** `password123`

### Available Services

After running `pnpm dev:all`, these services are available:

| Service | URL | Purpose |
|---------|-----|---------|
| **Web App** | http://localhost:3000 | Main application |
| **Prisma Studio** | Run `pnpm db:studio` | Database GUI |
| **MinIO Console** | http://localhost:9001 | Storage management |
| **Meilisearch** | http://localhost:7700 | Search engine |
| **PostgreSQL** | localhost:5433 | Database |
| **Redis** | localhost:6379 | Cache & queues |

**Worker Logs:** `tail -f .workers.log`

### Stop Everything

```bash
# Stop all services gracefully
pnpm dev:stop
```

This stops:
- Web application
- Background workers
- Docker services (data is preserved)

### Troubleshooting Quick Start

**Problem: Docker not running**
```bash
# Start Docker Desktop first, then:
pnpm dev:all
```

**Problem: Port 3000 already in use**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
pnpm dev:all
```

**Problem: Database connection failed**
```bash
# Reset and restart
pnpm docker:clean
pnpm dev:all
```

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 📁 Project Structure

```
playpatch/
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   ├── workers/            # Background job workers
│   ├── shared/             # Shared utilities
│   └── ai-safety/          # AI safety module
├── infrastructure/
│   ├── docker/             # Dockerfiles
│   ├── compose/            # Docker Compose files
│   └── scripts/            # Deployment scripts
├── docs/                   # Documentation
└── tests/                  # E2E tests
```

## 🛠️ Development

### Daily Workflow

```bash
# Start development (once per day)
pnpm dev:all

# The application will open at http://localhost:3000
# Workers run automatically in the background
# Press Ctrl+C to stop the web app (workers keep running)

# Stop everything when done
pnpm dev:stop
```

### Common Commands

**Starting & Stopping:**
```bash
pnpm dev:all         # Start everything (web + workers + docker)
pnpm dev:stop        # Stop everything gracefully
pnpm dev             # Just web app (no workers)
pnpm workers:dev     # Just background workers
```

**Database Management:**
```bash
pnpm db:studio       # Open Prisma Studio (GUI database viewer)
pnpm db:migrate      # Run new migrations
pnpm db:seed         # Seed demo data
pnpm db:reset        # Reset database (⚠️ deletes all data!)
```

**Docker Services:**
```bash
pnpm docker:dev      # Start Docker services only
pnpm docker:stop     # Stop Docker services
pnpm docker:restart  # Restart services
pnpm docker:status   # Check service status
pnpm docker:logs     # View all service logs
pnpm docker:clean    # Remove all volumes (⚠️ deletes data!)
```

**Monitoring & Debugging:**
```bash
pnpm health:check    # Verify all services are healthy
pnpm health:api      # API health status (requires app running)
tail -f .workers.log # View worker logs in real-time
pnpm docker:logs     # View Docker service logs
```

**Testing:**
```bash
pnpm test            # Run all tests
pnpm test:watch      # Watch mode for TDD
pnpm test:e2e        # End-to-end tests
```

Run `pnpm run` to see all available commands.

### Tech Stack

- **Frontend**: Next.js 14+, React 18+, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, BullMQ
- **Database**: PostgreSQL 16 + Prisma
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Search**: Meilisearch
- **AI**: Ollama (local) or OpenAI
- **Monitoring**: Sentry (optional, for error tracking)
- **Infrastructure**: Docker, Traefik

## 📚 Documentation

**Getting Started:**
- [Complete Getting Started Guide](./GETTING_STARTED.md) - Detailed setup and architecture
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

**Project Documentation:**
- [Product Requirements](./PRD.md) - Feature requirements
- [RealDebrid Integration](./docs/REALDEBRID_INTEGRATION.md) - RealDebrid setup and usage
- [YouTube Import Setup](./docs/YOUTUBE_IMPORT_SETUP.md) - Configure YouTube imports
- [Analytics Revamp](./docs/analytics-revamp-prd.md) - Analytics features

**Architecture:**
- [Stack Overview](./.planning/codebase/STACK.md) - Technology stack
- [Architecture](./.planning/codebase/ARCHITECTURE.md) - System architecture
- [Structure](./.planning/codebase/STRUCTURE.md) - Codebase organization
- [Conventions](./.planning/codebase/CONVENTIONS.md) - Coding standards

## 🔒 Security

PlayPatch takes security and child safety seriously:

- All content is pre-approved by parents
- AI interactions are logged and monitored
- Multiple layers of content filtering
- No external tracking or analytics
- All data stays on your infrastructure

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for safer digital experiences for children
- Built with privacy and parental control as core principles

## 📧 Support

For support, please open an issue on GitHub or contact [your-email@example.com].

---

**⚠️ Important**: PlayPatch is designed for self-hosting. Please ensure you comply with all relevant copyright laws when importing content from external sources.
