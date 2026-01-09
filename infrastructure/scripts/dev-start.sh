#!/bin/bash

# Start development environment
# This script starts all infrastructure services and the development server

set -e

echo "🚀 Starting SafeStream Kids Development Environment..."

# Change to project root
cd "$(dirname "$0")/../.."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your configuration!"
  echo "   Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
  exit 1
fi

# Start infrastructure services
echo "🐳 Starting Docker services..."
cd infrastructure/compose
docker compose --env-file ../../.env -f docker-compose.yml -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Go back to root
cd ../..

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate || echo "⚠️  Database migration failed - you may need to run it manually"

# Pull Ollama model if needed
echo "🤖 Checking Ollama model..."
docker exec safestream-ollama ollama pull llama3.1:8b || echo "⚠️  Failed to pull Ollama model - will retry later"

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Services:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - MinIO Console: http://localhost:9001"
echo "   - Meilisearch: http://localhost:7700"
echo "   - Ollama: http://localhost:11434"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: pnpm dev"
echo "   2. Open: http://localhost:3000"
echo ""
echo "📊 View logs: pnpm docker:logs"
echo "🛑 Stop services: pnpm docker:down"
