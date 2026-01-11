# SafeStream Kids

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

- **Node.js** 20+
- **pnpm** 8+
- **Docker** & **Docker Compose**
- **Git**

### Automated Setup (Recommended)

```bash
# Clone and navigate
git clone https://github.com/yourusername/safestream-kids.git
cd safestream-kids

# Run complete setup (checks prerequisites, installs deps, sets up services)
pnpm setup

# Start development environment (starts all services + web app + workers)
pnpm dev:all
```

Open http://localhost:3000 and login with demo account:
- **Email:** demo@example.com
- **Password:** password123

### Manual Setup

If you prefer step-by-step control, see the [Complete Setup Guide](./SETUP_GUIDE.md).

### Verify Installation

```bash
# Check all services are healthy
pnpm health:check

# View detailed health status
pnpm health:api
```

## 📁 Project Structure

```
safestream-kids/
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

### Common Commands

**Daily Development:**
```bash
pnpm dev:all         # Start everything (recommended)
pnpm dev             # Just web app
pnpm workers:dev     # Just background workers
```

**Testing:**
```bash
pnpm test            # Run all tests
pnpm test:watch      # Watch mode for TDD
pnpm test:coverage   # Generate coverage report
```

**Database:**
```bash
pnpm db:studio       # Open Prisma Studio GUI
pnpm db:migrate      # Run migrations
pnpm db:seed         # Seed demo data
pnpm db:reset        # Reset database (caution!)
```

**Docker Services:**
```bash
pnpm docker:dev      # Start all services
pnpm docker:stop     # Stop services
pnpm docker:restart  # Restart services
pnpm docker:status   # Check service status
pnpm docker:logs     # View all logs
```

**Health & Maintenance:**
```bash
pnpm health:check    # Verify all services
pnpm health:api      # API health status
pnpm status          # System status overview
pnpm clean:all       # Clean everything
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete command reference.

### Tech Stack

- **Frontend**: Next.js 14+, React 18+, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, BullMQ
- **Database**: PostgreSQL 16 + Prisma
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Search**: Meilisearch
- **AI**: Ollama (local) or OpenAI
- **Infrastructure**: Docker, Traefik

## 📚 Documentation

**Getting Started:**
- [Complete Setup Guide](./SETUP_GUIDE.md) - Step-by-step installation
- [Testing Guide](./TESTING_GUIDE.md) - How to write and run tests
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions

**Development:**
- [Code Review Report](./CODE_REVIEW_REPORT.md) - Code quality analysis
- [Testing Setup Summary](./TESTING_SETUP_SUMMARY.md) - Quick testing reference
- [Session Summary](./SESSION_SUMMARY.md) - Recent improvements log

**Project Documentation:**
- [Product Requirements (PRD)](./docs/PRD.md)
- [Technical Design](./docs/TECHNICAL_DESIGN.md)
- [Development Checklist](./docs/DEVELOPMENT_CHECKLIST.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)

## 🔒 Security

SafeStream Kids takes security and child safety seriously:

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

**⚠️ Important**: SafeStream Kids is designed for self-hosting. Please ensure you comply with all relevant copyright laws when importing content from external sources.
