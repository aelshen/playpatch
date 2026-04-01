#!/bin/bash

###############################################################################
# PlayPatch Development Environment Health Check
# Verifies all required services are running and accessible
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall health
ALL_HEALTHY=true

# Header
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      PlayPatch Development Environment Health Check       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Helper Functions
###############################################################################

check_service() {
  local service_name=$1
  local check_command=$2
  local fix_command=$3

  echo -n "Checking ${service_name}... "

  if eval "$check_command" &>/dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    return 0
  else
    echo -e "${RED}✗ Not running${NC}"
    if [ -n "$fix_command" ]; then
      echo -e "  ${YELLOW}Fix:${NC} $fix_command"
    fi
    ALL_HEALTHY=false
    return 1
  fi
}

check_port() {
  local service_name=$1
  local host=$2
  local port=$3
  local fix_command=$4

  echo -n "Checking ${service_name} (${host}:${port})... "

  if nc -z "$host" "$port" 2>/dev/null; then
    echo -e "${GREEN}✓ Accessible${NC}"
    return 0
  else
    echo -e "${RED}✗ Not accessible${NC}"
    if [ -n "$fix_command" ]; then
      echo -e "  ${YELLOW}Fix:${NC} $fix_command"
    fi
    ALL_HEALTHY=false
    return 1
  fi
}

check_http_endpoint() {
  local service_name=$1
  local url=$2
  local expected_status=${3:-200}
  local fix_command=$4

  echo -n "Checking ${service_name} (${url})... "

  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ Accessible (HTTP ${status_code})${NC}"
    return 0
  elif [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
    echo -e "${YELLOW}⚠ Authentication required (HTTP ${status_code})${NC}"
    echo -e "  ${YELLOW}Warning:${NC} Service is running but requires authentication"
    ALL_HEALTHY=false
    return 1
  else
    echo -e "${RED}✗ Not accessible (HTTP ${status_code})${NC}"
    if [ -n "$fix_command" ]; then
      echo -e "  ${YELLOW}Fix:${NC} $fix_command"
    fi
    ALL_HEALTHY=false
    return 1
  fi
}

###############################################################################
# Check Prerequisites
###############################################################################

echo -e "${BLUE}[1] Prerequisites${NC}"

# Check Docker
check_service "Docker daemon" "docker info" "Start Docker Desktop or run: sudo systemctl start docker"

# Check Node.js
check_service "Node.js" "node --version" "Install Node.js: https://nodejs.org/"

# Check pnpm
check_service "pnpm" "pnpm --version" "Install pnpm: npm install -g pnpm"

echo ""

###############################################################################
# Check Docker Services
###############################################################################

echo -e "${BLUE}[2] Docker Services${NC}"

# Check PostgreSQL
check_port "PostgreSQL" "localhost" "5433" "pnpm docker:dev (ensure PostgreSQL container is running)"

# Check Redis
check_port "Redis" "localhost" "6379" "pnpm docker:dev (ensure Redis container is running)"

# Check MinIO
check_port "MinIO API" "localhost" "9000" "pnpm docker:dev (ensure MinIO container is running)"

# Check MinIO Console
check_port "MinIO Console" "localhost" "9001" "pnpm docker:dev (ensure MinIO container is running)"

# Check Meilisearch
check_http_endpoint "Meilisearch" "http://localhost:7700/health" "200" "pnpm docker:dev (ensure Meilisearch container is running)"

echo ""

###############################################################################
# Check Database Connection
###############################################################################

echo -e "${BLUE}[3] Database Connection${NC}"

# Calculate project root relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/apps/web/.env" ]; then
  echo -e "${RED}✗ .env file not found${NC}"
  echo -e "  ${YELLOW}Fix:${NC} cp .env.example apps/web/.env && edit with your values"
  ALL_HEALTHY=false
else
  echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Try to connect to PostgreSQL using Prisma
echo -n "Checking Prisma database connection... "
if (cd "$PROJECT_ROOT/apps/web" && pnpm prisma db execute --stdin <<< "SELECT 1;") &>/dev/null; then
  echo -e "${GREEN}✓ Connected${NC}"
else
  echo -e "${RED}✗ Cannot connect${NC}"
  echo -e "  ${YELLOW}Fix:${NC} Check DATABASE_URL in apps/web/.env"
  ALL_HEALTHY=false
fi

echo ""

###############################################################################
# Check Optional Services
###############################################################################

echo -e "${BLUE}[4] Optional Services${NC}"

# Check Ollama (optional for AI features)
if check_port "Ollama" "localhost" "11434" "" 2>/dev/null; then
  :
else
  echo -e "  ${YELLOW}Note:${NC} Ollama not running (optional). Install: https://ollama.ai/"
fi

echo ""

###############################################################################
# Check File Permissions
###############################################################################

echo -e "${BLUE}[5] File Permissions${NC}"

# Check storage directory (using PROJECT_ROOT calculated earlier)
if [ -d "$PROJECT_ROOT/storage" ]; then
  if [ -w "$PROJECT_ROOT/storage" ]; then
    echo -e "${GREEN}✓ Storage directory writable${NC}"
  else
    echo -e "${RED}✗ Storage directory not writable${NC}"
    echo -e "  ${YELLOW}Fix:${NC} chmod 755 storage"
    ALL_HEALTHY=false
  fi
else
  echo -e "${YELLOW}⚠ Storage directory does not exist${NC}"
  echo -e "  ${YELLOW}Note:${NC} Will be created automatically when needed"
fi

echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
if [ "$ALL_HEALTHY" = true ]; then
  echo -e "${BLUE}║${NC}                  ${GREEN}✓ All Systems Ready!${NC}                     ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}You can now start development:${NC}"
  echo -e "  ${BLUE}pnpm dev:all${NC}  - Start all services"
  echo -e "  ${BLUE}pnpm dev${NC}      - Start Next.js only"
  echo ""
  exit 0
else
  echo -e "${BLUE}║${NC}               ${RED}✗ Issues Found - See Above${NC}               ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${RED}Please fix the issues above before starting development.${NC}"
  echo ""
  echo -e "${YELLOW}Quick fixes:${NC}"
  echo -e "  1. Start Docker: ${BLUE}open -a Docker${NC} (macOS) or ${BLUE}sudo systemctl start docker${NC} (Linux)"
  echo -e "  2. Start services: ${BLUE}pnpm docker:dev${NC}"
  echo -e "  3. Check .env: ${BLUE}cp .env.example apps/web/.env${NC}"
  echo -e "  4. Run migrations: ${BLUE}cd apps/web && pnpm prisma migrate dev${NC}"
  echo ""
  exit 1
fi
