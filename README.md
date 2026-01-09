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

- **Node.js** 20+ (managed via nvm recommended)
- **pnpm** 8+
- **Docker** & **Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/safestream-kids.git
   cd safestream-kids
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   pnpm docker:dev
   ```

5. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

6. **Seed initial data (optional)**
   ```bash
   pnpm db:seed
   ```

7. **Start development server**
   ```bash
   pnpm dev
   ```

8. **Open your browser**
   ```
   http://localhost:3000
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

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run linter
- `pnpm test` - Run tests
- `pnpm db:studio` - Open Prisma Studio
- `pnpm docker:dev` - Start Docker services
- `pnpm workers:dev` - Start background workers

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

- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Technical Design](./docs/TECHNICAL_DESIGN.md)
- [Development Checklist](./docs/DEVELOPMENT_CHECKLIST.md)
- [API Documentation](./docs/API.md) (coming soon)
- [Deployment Guide](./docs/DEPLOYMENT.md) (coming soon)

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
