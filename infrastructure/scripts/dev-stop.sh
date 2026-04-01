#!/bin/bash
# Stop PlayPatch Development Environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC}  $1"; }

# Change to project root
cd "$(dirname "$0")/../.."

echo ""
echo "🛑 Stopping PlayPatch Development Environment..."
echo ""

# Stop workers
if [ -f .workers.pid ]; then
    WORKER_PID=$(cat .workers.pid)
    if ps -p $WORKER_PID > /dev/null 2>&1; then
        print_info "Stopping workers (PID: $WORKER_PID)..."
        kill $WORKER_PID 2>/dev/null || true
        rm .workers.pid
        print_success "Workers stopped"
    fi
fi

# Kill any remaining worker processes
pkill -f "tsx.*worker" >/dev/null 2>&1 || true
pkill -f "pnpm.*workers" >/dev/null 2>&1 || true

# Stop web app
if [ -f .web.pid ]; then
    WEB_PID=$(cat .web.pid)
    if ps -p $WEB_PID > /dev/null 2>&1; then
        print_info "Stopping web application (PID: $WEB_PID)..."
        kill $WEB_PID 2>/dev/null || true
        rm .web.pid
        print_success "Web application stopped"
    fi
fi

# Stop Docker services
print_info "Stopping Docker services..."
cd infrastructure/compose
docker compose --env-file ../../.env -f docker-compose.yml stop >/dev/null 2>&1 || true
cd ../..
print_success "Docker services stopped"

echo ""
print_success "All services stopped successfully!"
echo ""
echo "To start again: pnpm dev:all"
echo "To remove data:  pnpm docker:clean"
echo ""
