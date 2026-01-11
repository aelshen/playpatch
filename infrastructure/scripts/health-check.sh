#!/bin/bash
# Health check script for SafeStream Kids
# Checks all services and reports status

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ "$2" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $1: ${GREEN}$2${NC}"
    elif [ "$2" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $1: ${YELLOW}$3${NC}"
    else
        echo -e "${RED}✗${NC} $1: ${RED}$2${NC}"
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SafeStream Kids - Health Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check Docker is running
if ! docker ps >/dev/null 2>&1; then
    print_status "Docker" "NOT RUNNING"
    echo ""
    echo "Please start Docker Desktop and try again."
    exit 1
fi

print_status "Docker" "OK"

# Check PostgreSQL
if docker ps --filter "name=safestream-postgres" --filter "status=running" | grep -q safestream-postgres; then
    if docker ps --filter "name=safestream-postgres" --filter "health=healthy" | grep -q safestream-postgres; then
        print_status "PostgreSQL" "OK"
    else
        print_status "PostgreSQL" "WARN" "Running but not healthy yet"
    fi
else
    print_status "PostgreSQL" "NOT RUNNING"
fi

# Check Redis
if docker ps --filter "name=safestream-redis" --filter "status=running" | grep -q safestream-redis; then
    # Test Redis connection
    if docker exec safestream-redis redis-cli ping 2>/dev/null | grep -q PONG; then
        print_status "Redis" "OK"
    else
        print_status "Redis" "WARN" "Running but not responding"
    fi
else
    print_status "Redis" "NOT RUNNING"
fi

# Check MinIO
if docker ps --filter "name=safestream-minio" --filter "status=running" | grep -q safestream-minio; then
    print_status "MinIO" "OK"
else
    print_status "MinIO" "NOT RUNNING"
fi

# Check Meilisearch
if docker ps --filter "name=safestream-meilisearch" --filter "status=running" | grep -q safestream-meilisearch; then
    print_status "Meilisearch" "OK"
else
    print_status "Meilisearch" "NOT RUNNING"
fi

# Check Ollama (optional)
if docker ps --filter "name=safestream-ollama" --filter "status=running" | grep -q safestream-ollama; then
    print_status "Ollama (AI)" "OK"
else
    print_status "Ollama (AI)" "WARN" "Not running (optional service)"
fi

echo ""

# Check web app
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_status "Web App" "OK" "http://localhost:3000"
else
    print_status "Web App" "NOT RUNNING" "Start with: pnpm dev"
fi

# Check API health endpoint
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    STATUS=$(echo $HEALTH | grep -o '"overall":"[^"]*"' | cut -d'"' -f4)

    if [ "$STATUS" = "healthy" ]; then
        print_status "API Health" "OK" "All services healthy"
    elif [ "$STATUS" = "degraded" ]; then
        print_status "API Health" "WARN" "Some services degraded"
    else
        print_status "API Health" "WARN" "Check http://localhost:3000/api/health"
    fi
else
    print_status "API Health" "N/A" "Web app not running"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Exit with error if critical services are down
if ! docker ps --filter "name=safestream-postgres" --filter "status=running" | grep -q safestream-postgres; then
    echo -e "${RED}Critical services are not running!${NC}"
    echo "Start them with: pnpm docker:dev"
    exit 1
fi

echo -e "${GREEN}Health check complete!${NC}"
