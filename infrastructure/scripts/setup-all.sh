#!/bin/bash
# Complete setup script for SafeStream Kids
# This script handles the entire setup process from scratch

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local has_error=false

    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_NODE_VERSION="20.0.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE_VERSION" ]; then
            print_success "Node.js $(node --version) installed"
        else
            print_error "Node.js version must be >= 20.0.0 (found: $NODE_VERSION)"
            has_error=true
        fi
    else
        print_error "Node.js is not installed"
        print_info "Install from: https://nodejs.org/"
        has_error=true
    fi

    # Check pnpm
    if command_exists pnpm; then
        print_success "pnpm $(pnpm --version) installed"
    else
        print_error "pnpm is not installed"
        print_info "Install with: npm install -g pnpm"
        has_error=true
    fi

    # Check Docker
    if command_exists docker; then
        print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) installed"
    else
        print_error "Docker is not installed"
        print_info "Install from: https://www.docker.com/get-started"
        has_error=true
    fi

    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose installed"
    else
        print_error "Docker Compose is not installed"
        has_error=true
    fi

    # Check Git
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3) installed"
    else
        print_error "Git is not installed"
        has_error=true
    fi

    if [ "$has_error" = true ]; then
        echo ""
        print_error "Prerequisites check failed. Please install missing software and try again."
        exit 1
    fi

    echo ""
    print_success "All prerequisites satisfied!"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    print_info "This will take 2-5 minutes depending on your connection..."

    if pnpm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"

    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return
        fi
    fi

    print_info "Copying .env.example to .env"
    cp .env.example .env

    # Generate NEXTAUTH_SECRET if openssl is available
    if command_exists openssl; then
        print_info "Generating NEXTAUTH_SECRET..."
        SECRET=$(openssl rand -base64 32)

        # Update .env file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/NEXTAUTH_SECRET=generate_this_with_openssl_rand_base64_32/NEXTAUTH_SECRET=$SECRET/" .env
        else
            # Linux
            sed -i "s/NEXTAUTH_SECRET=generate_this_with_openssl_rand_base64_32/NEXTAUTH_SECRET=$SECRET/" .env
        fi

        print_success "NEXTAUTH_SECRET generated and saved to .env"
    else
        print_warning "openssl not found - please manually set NEXTAUTH_SECRET in .env"
    fi

    print_success "Environment configured"
}

# Start Docker services
start_docker_services() {
    print_header "Starting Docker Services"

    print_info "Starting PostgreSQL, Redis, MinIO, Meilisearch..."
    print_info "This will take about 30 seconds..."

    cd infrastructure/compose

    if docker compose --env-file ../../.env -f docker-compose.yml -f docker-compose.dev.yml up -d; then
        cd ../..
        print_success "Docker services started"
    else
        cd ../..
        print_error "Failed to start Docker services"
        exit 1
    fi

    # Wait for services to be healthy
    print_info "Waiting for services to be ready..."
    sleep 10

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker ps --filter "name=safestream-postgres" --filter "health=healthy" | grep -q safestream-postgres; then
            print_success "PostgreSQL is ready"
            break
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        print_warning "PostgreSQL health check timeout (but may still work)"
    fi

    echo ""
}

# Setup database
setup_database() {
    print_header "Setting Up Database"

    print_info "Running Prisma migrations..."

    cd apps/web

    if pnpm prisma migrate dev --name init; then
        print_success "Database migrations completed"
    else
        cd ../..
        print_error "Failed to run migrations"
        exit 1
    fi

    cd ../..

    # Seed database
    print_info "Seeding initial data..."

    if pnpm db:seed; then
        print_success "Database seeded with demo data"
    else
        print_warning "Failed to seed database (you can do this later)"
    fi
}

# Pull Ollama model
setup_ollama() {
    print_header "Setting Up Ollama (Optional)"

    print_info "Ollama provides local AI features (requires ~10GB disk space)"
    print_info "This step can take 5-10 minutes depending on your connection"

    read -p "Do you want to download the AI model now? (y/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Downloading Llama 3.1 8B model..."

        if docker exec safestream-ollama ollama pull llama3.1:8b; then
            print_success "AI model downloaded successfully"
        else
            print_warning "Failed to download AI model (you can do this later with: pnpm ollama:pull)"
        fi
    else
        print_info "Skipping AI model download (you can download later with: pnpm ollama:pull)"
    fi
}

# Verify installation
verify_installation() {
    print_header "Verifying Installation"

    print_info "Checking services..."

    # Check PostgreSQL
    if docker ps --filter "name=safestream-postgres" --filter "status=running" | grep -q safestream-postgres; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
    fi

    # Check Redis
    if docker ps --filter "name=safestream-redis" --filter "status=running" | grep -q safestream-redis; then
        print_success "Redis is running"
    else
        print_error "Redis is not running"
    fi

    # Check MinIO
    if docker ps --filter "name=safestream-minio" --filter "status=running" | grep -q safestream-minio; then
        print_success "MinIO is running"
    else
        print_error "MinIO is not running"
    fi

    # Check Meilisearch
    if docker ps --filter "name=safestream-meilisearch" --filter "status=running" | grep -q safestream-meilisearch; then
        print_success "Meilisearch is running"
    else
        print_error "Meilisearch is not running"
    fi

    print_success "Verification complete!"
}

# Print next steps
print_next_steps() {
    print_header "Setup Complete! 🎉"

    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Start the development server:"
    echo -e "     ${GREEN}pnpm dev${NC}"
    echo ""
    echo "  2. Open your browser:"
    echo -e "     ${GREEN}http://localhost:3030${NC}"
    echo ""
    echo "  3. Login with demo account:"
    echo -e "     Email:    ${YELLOW}demo@example.com${NC}"
    echo -e "     Password: ${YELLOW}password123${NC}"
    echo ""
    echo "  4. (Optional) Start background workers:"
    echo -e "     ${GREEN}pnpm workers:dev${NC}"
    echo ""
    echo "Useful commands:"
    echo -e "  ${BLUE}pnpm dev:all${NC}          - Start everything (web + workers)"
    echo -e "  ${BLUE}pnpm db:studio${NC}        - Open database viewer"
    echo -e "  ${BLUE}pnpm test${NC}             - Run tests"
    echo -e "  ${BLUE}pnpm docker:logs${NC}      - View Docker logs"
    echo -e "  ${BLUE}pnpm health:check${NC}     - Check system health"
    echo ""
    echo "Documentation:"
    echo -e "  ${BLUE}SETUP_GUIDE.md${NC}        - Detailed setup guide"
    echo -e "  ${BLUE}DEVELOPMENT.md${NC}        - Development workflow"
    echo -e "  ${BLUE}TROUBLESHOOTING.md${NC}   - Common issues"
    echo ""
}

# Main execution
main() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║              SafeStream Kids - Setup Script               ║"
    echo "║                                                           ║"
    echo "║           Complete installation in 5-10 minutes           ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    print_info "This script will:"
    echo "  • Check prerequisites"
    echo "  • Install dependencies"
    echo "  • Configure environment"
    echo "  • Start Docker services"
    echo "  • Setup database"
    echo "  • Verify installation"
    echo ""

    read -p "Continue with setup? (Y/n) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
        echo "Setup cancelled."
        exit 0
    fi

    # Run setup steps
    check_prerequisites
    install_dependencies
    setup_environment
    start_docker_services
    setup_database
    setup_ollama
    verify_installation
    print_next_steps
}

# Run main function
main
