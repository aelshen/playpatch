#!/bin/bash

# Complete setup script for SafeStream Kids
# Run this once to set up everything from scratch

set -e

echo "🚀 SafeStream Kids - Complete Setup"
echo "===================================="
echo ""

# Change to project root
cd "$(dirname "$0")/../.."

# Check prerequisites
echo "1️⃣ Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first: npm install -g pnpm"
    exit 1
fi

echo "✅ Prerequisites satisfied"
echo ""

# Create .env if it doesn't exist
echo "2️⃣ Setting up environment configuration..."
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env

    # Generate NEXTAUTH_SECRET
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -base64 32)
        # Update the .env file with the generated secret
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env
        else
            sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env
        fi
        echo "✅ Generated NEXTAUTH_SECRET"
    fi
else
    echo "✅ .env already exists"
fi

# Create symlink for web app
if [ ! -L apps/web/.env ]; then
    ln -sf ../../.env apps/web/.env
    echo "✅ Created .env symlink for web app"
fi
echo ""

# Install dependencies
echo "3️⃣ Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Start Docker services
echo "4️⃣ Starting Docker services..."
cd infrastructure/compose
docker compose --env-file ../../.env -f docker-compose.yml -f docker-compose.dev.yml up -d
cd ../..
echo "✅ Docker services started"
echo ""

# Wait for services to be healthy
echo "5️⃣ Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
echo "   Checking PostgreSQL..."
until docker exec safestream-postgres pg_isready -U safestream > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "   ✅ PostgreSQL ready"

# Check Redis
echo "   Checking Redis..."
until docker exec safestream-redis redis-cli ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo "   ✅ Redis ready"

echo "✅ All services healthy"
echo ""

# Generate Prisma client
echo "6️⃣ Generating Prisma client..."
cd apps/web && pnpm prisma generate
cd ../..
echo "✅ Prisma client generated"
echo ""

# Set up database
echo "7️⃣ Setting up database..."
cd apps/web
pnpm prisma db push
echo "✅ Database schema created"
echo ""

# Seed database
echo "8️⃣ Seeding database with demo data..."
pnpm tsx prisma/seed.ts
cd ../..
echo "✅ Database seeded"
echo ""

# Pull Ollama model
echo "9️⃣ Pulling Ollama model (this may take a while)..."
docker exec safestream-ollama ollama pull llama3.1:8b || echo "⚠️  Ollama model pull failed - you can retry later with: pnpm ollama:pull"
echo ""

echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Services Running:"
echo "   • PostgreSQL:      localhost:5433"
echo "   • Redis:           localhost:6379"
echo "   • MinIO Console:   http://localhost:9001"
echo "   • Meilisearch:     http://localhost:7700"
echo "   • Ollama:          http://localhost:11434"
echo ""
echo "🔐 Demo Credentials:"
echo "   Email:    admin@safestream.local"
echo "   Password: password123"
echo ""
echo "🎯 Next Steps:"
echo "   1. Start the dev server:  pnpm dev"
echo "   2. Open your browser:     http://localhost:3030"
echo ""
echo "📚 Useful Commands:"
echo "   pnpm status         - Check service health"
echo "   pnpm db:reset       - Reset database to fresh state"
echo "   pnpm db:studio      - Open Prisma Studio"
echo "   pnpm docker:logs    - View Docker logs"
echo "   pnpm docker:down    - Stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
