#!/bin/bash

###############################################################################
# PlayPatch Uninstaller
# Removes PlayPatch and all associated data
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
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

# Stop services
stop_services() {
    print_header "Stopping Services"

    if [ -f "package.json" ]; then
        print_info "Stopping web application and workers..."
        pnpm dev:stop 2>/dev/null || print_warning "Services may not be running"
        print_success "Services stopped"
    fi
}

# Stop and remove Docker containers
cleanup_docker() {
    print_header "Cleaning Up Docker Containers"

    if [ -d "infrastructure/compose" ]; then
        cd infrastructure/compose

        print_info "Stopping Docker containers..."
        docker compose --env-file ../../.env -f docker-compose.yml down 2>/dev/null || print_warning "Docker containers may not be running"

        print_warning "Do you want to remove Docker volumes (this will delete all data)?"
        read -p "Remove volumes? (y/N) " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Removing Docker volumes..."
            docker compose --env-file ../../.env -f docker-compose.yml down -v
            print_success "Docker volumes removed"
        else
            print_info "Keeping Docker volumes (data preserved)"
        fi

        cd ../..
    fi

    print_success "Docker cleanup complete"
}

# Remove files
remove_files() {
    print_header "Removing Files"

    INSTALL_DIR=$(pwd)

    print_warning "This will permanently delete PlayPatch from:"
    print_warning "$INSTALL_DIR"
    echo ""
    print_info "The following will be removed:"
    echo "  • Application code"
    echo "  • Node modules (~500MB)"
    echo "  • Configuration files (.env)"
    echo "  • Local storage (if using local storage)"
    echo ""

    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Uninstallation cancelled"
        exit 0
    fi

    cd ..

    print_info "Removing $INSTALL_DIR..."
    rm -rf "$INSTALL_DIR"

    print_success "PlayPatch removed"
}

# Print final message
print_final_message() {
    print_header "Uninstallation Complete"

    echo ""
    echo -e "${GREEN}PlayPatch has been removed from your system.${NC}"
    echo ""
    echo "What remains:"
    echo -e "  • Docker images (if you want to remove: ${BLUE}docker system prune -a${NC})"
    echo -e "  • Docker volumes (if preserved)"
    echo ""
    echo "To reinstall PlayPatch:"
    echo -e "  ${BLUE}curl -fsSL https://raw.githubusercontent.com/yourusername/playpatch/main/install.sh | bash${NC}"
    echo ""
    echo "Thank you for trying PlayPatch!"
    echo ""
}

# Main execution
main() {
    clear
    echo -e "${RED}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║              PlayPatch - Uninstaller                      ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    print_warning "This will remove PlayPatch from your system."
    echo ""

    stop_services
    cleanup_docker
    remove_files
    print_final_message
}

# Run main function
main
