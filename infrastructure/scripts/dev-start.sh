#!/bin/bash
# Development Environment Startup Script for PlayPatch
# Starts all services, initializes storage, and launches workers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════${NC}\n"
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC}  $1"; }
print_info() { echo -e "${BLUE}ℹ${NC}  $1"; }

# Change to project root
cd "$(dirname "$0")/../.."

print_header "🚀 Starting PlayPatch Development Environment"

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found"
    print_info "Creating from .env.example..."
    cp .env.example .env

    # Generate NEXTAUTH_SECRET if openssl available
    if command -v openssl >/dev/null 2>&1; then
        SECRET=$(openssl rand -base64 32)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/NEXTAUTH_SECRET=\".*\"/NEXTAUTH_SECRET=\"$SECRET\"/" .env
        else
            sed -i "s/NEXTAUTH_SECRET=\".*\"/NEXTAUTH_SECRET=\"$SECRET\"/" .env
        fi
        print_success "Generated NEXTAUTH_SECRET"
    fi
fi

# Step 1: Start Docker Services
print_header "1/6 Starting Docker Services"
print_info "Starting PostgreSQL, Redis, MinIO, Meilisearch, Ollama..."

cd infrastructure/compose
if docker compose --env-file ../../.env -f docker-compose.yml -f docker-compose.dev.yml up -d; then
    cd ../..
    print_success "Docker services started"
else
    cd ../..
    print_error "Failed to start Docker services"
    exit 1
fi

# Step 2: Wait for Services
print_header "2/6 Waiting for Services to be Ready"
print_info "This takes about 15-20 seconds..."

sleep 5

# Wait for PostgreSQL
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec playpatch-postgres pg_isready -U playpatch >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_error "PostgreSQL failed to start in time"
    exit 1
fi

# Wait for Redis
if docker exec playpatch-redis redis-cli ping >/dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis may not be fully ready"
fi

# Step 3: Initialize Storage
print_header "3/6 Initializing Storage"

# Read storage path from .env
STORAGE_PATH=$(grep "LOCAL_STORAGE_PATH=" .env | cut -d'=' -f2)
if [ -z "$STORAGE_PATH" ]; then
    STORAGE_PATH="./storage"
    print_info "Using default storage path: $STORAGE_PATH"
fi

print_info "Creating storage directories..."
mkdir -p "$STORAGE_PATH"/{videos,thumbnails,avatars,journals}
print_success "Storage directories created at $STORAGE_PATH"

# Step 4: Database Setup
print_header "4/6 Setting Up Database"

print_info "Running Prisma migrations..."
cd apps/web
if pnpm prisma migrate dev --name init >/dev/null 2>&1; then
    print_success "Database migrations completed"
else
    print_warning "Migration skipped (may already be applied)"
fi

# Seed database if empty
print_info "Checking if database needs seeding..."
USER_COUNT=$(pnpm prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tail -1 | tr -d ' ' || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    print_info "Seeding database with demo data..."
    if pnpm tsx prisma/seed.ts; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed (you can run manually: pnpm db:seed)"
    fi
else
    print_success "Database already contains data"
fi

cd ../..

# Step 5: Start Background Workers
print_header "5/6 Starting Background Workers"

print_info "Starting video processing workers..."

# Kill any existing worker processes
pkill -f "tsx.*worker" >/dev/null 2>&1 || true
pkill -f "pnpm.*workers" >/dev/null 2>&1 || true

# Start workers in background
cd packages/workers
nohup pnpm dev > ../../.workers.log 2>&1 &
WORKER_PID=$!
cd ../..

sleep 3

if ps -p $WORKER_PID > /dev/null; then
    print_success "Workers started (PID: $WORKER_PID)"
    echo $WORKER_PID > .workers.pid
else
    print_error "Workers failed to start"
    print_info "Check logs: tail -f .workers.log"
fi

# Step 6: Start Web Application
print_header "6/6 Starting Web Application"

print_info "Starting Next.js development server..."
print_info "This will take 10-15 seconds for initial build...\n"

cd apps/web
pnpm dev &
WEB_PID=$!
cd ../..

echo $WEB_PID > .web.pid

sleep 5

# Final status
print_header "✅ PlayPatch Development Environment Started!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐  Web Application:      http://localhost:3000"
echo "📊  Prisma Studio:        pnpm db:studio"
echo "💾  MinIO Console:        http://localhost:9001"
echo "🔍  Meilisearch:          http://localhost:7700"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝  Demo Login Credentials:"
echo "    Email:    demo@example.com"
echo "    Password: password123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧  Useful Commands:"
echo "    pnpm docker:logs      - View Docker service logs"
echo "    pnpm docker:stop      - Stop all services"
echo "    pnpm health:check     - Check system health"
echo "    tail -f .workers.log  - View worker logs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the web server"
echo "(Workers will continue running in background)"
echo ""

# Wait for web process
wait $WEB_PID
