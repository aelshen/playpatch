#!/bin/bash

# Stop development environment

set -e

echo "🛑 Stopping SafeStream Kids Development Environment..."

cd "$(dirname "$0")/../.."

cd infrastructure/compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

echo "✅ All services stopped"
echo ""
echo "💡 To remove all data volumes: pnpm docker:clean"
