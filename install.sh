#!/bin/bash

###############################################################################
# PlayPatch One-Click Installer
# Downloads, installs, and starts PlayPatch in one command
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/yourusername/playpatch.git"
INSTALL_DIR="${INSTALL_DIR:-$HOME/playpatch}"

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
            print_success "Node.js $(node --version)"
        else
            print_error "Node.js version must be >= 20.0.0 (found: $NODE_VERSION)"
            print_info "Download from: https://nodejs.org/"
            has_error=true
        fi
    else
        print_error "Node.js is not installed"
        print_info "Install from: https://nodejs.org/"
        has_error=true
    fi

    # Check pnpm
    if command_exists pnpm; then
        print_success "pnpm $(pnpm --version)"
    else
        print_error "pnpm is not installed"
        print_info "Install with: npm install -g pnpm"
        has_error=true
    fi

    # Check Docker
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
        else
            print_error "Docker is not running"
            print_info "Start Docker Desktop and try again"
            has_error=true
        fi
    else
        print_error "Docker is not installed"
        print_info "Install from: https://www.docker.com/get-started"
        has_error=true
    fi

    # Check Git
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3)"
    else
        print_error "Git is not installed"
        has_error=true
    fi

    if [ "$has_error" = true ]; then
        echo ""
        print_error "Prerequisites check failed. Please install missing software and try again."
        exit 1
    fi

    print_success "All prerequisites satisfied!"
}

# Clone repository
clone_repository() {
    print_header "Cloning PlayPatch Repository"

    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists"
        read -p "Do you want to remove it and start fresh? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Removing existing directory..."
            rm -rf "$INSTALL_DIR"
        else
            print_info "Using existing directory"
            cd "$INSTALL_DIR"
            return
        fi
    fi

    print_info "Cloning to $INSTALL_DIR..."
    if git clone "$REPO_URL" "$INSTALL_DIR"; then
        print_success "Repository cloned successfully"
        cd "$INSTALL_DIR"
    else
        print_error "Failed to clone repository"
        print_info "You can clone manually: git clone $REPO_URL"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    print_info "This will take 2-5 minutes depending on your connection..."

    if pnpm install; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Setup environment
setup_environment() {
    print_header "Configuring Environment"

    # Copy .env files
    if [ ! -f ".env" ]; then
        print_info "Creating .env file..."
        cp .env.example .env
        print_success ".env file created"
    else
        print_warning ".env file already exists, skipping"
    fi

    if [ ! -f "apps/web/.env" ]; then
        print_info "Creating apps/web/.env file..."
        cp apps/web/.env.example apps/web/.env
        print_success "apps/web/.env file created"
    else
        print_warning "apps/web/.env file already exists, skipping"
    fi

    # Generate NEXTAUTH_SECRET
    if command_exists openssl; then
        print_info "Generating NEXTAUTH_SECRET..."
        SECRET=$(openssl rand -base64 32)

        # Update apps/web/.env file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/NEXTAUTH_SECRET=generate_this_with_openssl_rand_base64_32/NEXTAUTH_SECRET=$SECRET/" apps/web/.env
        else
            # Linux
            sed -i "s/NEXTAUTH_SECRET=generate_this_with_openssl_rand_base64_32/NEXTAUTH_SECRET=$SECRET/" apps/web/.env
        fi

        print_success "NEXTAUTH_SECRET generated"
    else
        print_warning "openssl not found - NEXTAUTH_SECRET needs to be set manually"
    fi

    print_success "Environment configured"
}

# Start services
start_services() {
    print_header "Starting PlayPatch"

    print_info "Starting Docker services and web application..."
    print_info "This will take about 1-2 minutes on first run..."

    if pnpm dev:all; then
        print_success "PlayPatch is starting!"
    else
        print_error "Failed to start services"
        print_info "Try running 'pnpm health:check' to diagnose issues"
        exit 1
    fi
}

# Print success message
print_success_message() {
    print_header "Installation Complete! 🎉"

    echo ""
    echo -e "${GREEN}PlayPatch is now running!${NC}"
    echo ""
    echo "Open your browser and navigate to:"
    echo -e "  ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "Login with the demo account:"
    echo -e "  Email:    ${YELLOW}demo@example.com${NC}"
    echo -e "  Password: ${YELLOW}password123${NC}"
    echo ""
    echo "Useful commands:"
    echo -e "  ${BLUE}cd $INSTALL_DIR${NC}"
    echo -e "  ${BLUE}pnpm dev:all${NC}          - Start all services"
    echo -e "  ${BLUE}pnpm dev:stop${NC}         - Stop all services"
    echo -e "  ${BLUE}pnpm health:check${NC}     - Check system health"
    echo -e "  ${BLUE}pnpm db:studio${NC}        - Open database viewer"
    echo ""
    echo "To uninstall:"
    echo -e "  ${BLUE}bash $INSTALL_DIR/uninstall.sh${NC}"
    echo ""
    echo "Documentation:"
    echo -e "  ${BLUE}https://github.com/yourusername/playpatch/docs${NC}"
    echo ""
}

# Main execution
main() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║              PlayPatch - One-Click Installer              ║"
    echo "║                                                           ║"
    echo "║       Self-hosted video streaming platform for kids      ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    print_info "This installer will:"
    echo "  • Check prerequisites (Node.js, pnpm, Docker)"
    echo "  • Clone the PlayPatch repository"
    echo "  • Install dependencies (~2-5 minutes)"
    echo "  • Configure environment variables"
    echo "  • Start all services"
    echo ""
    print_info "Installation directory: $INSTALL_DIR"
    echo ""

    read -p "Continue with installation? (Y/n) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
        echo "Installation cancelled."
        exit 0
    fi

    # Run installation steps
    check_prerequisites
    clone_repository
    install_dependencies
    setup_environment
    start_services
    print_success_message
}

# Handle errors
trap 'print_error "Installation failed. Check the output above for details."' ERR

# Run main function
main
