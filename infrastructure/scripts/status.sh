#!/bin/bash

# Check status of all SafeStream Kids services

echo "🔍 SafeStream Kids - Service Status"
echo "===================================="
echo ""

cd "$(dirname "$0")/../.."

# Check Docker services
echo "📦 Docker Services:"
echo ""

services=("safestream-postgres" "safestream-redis" "safestream-minio" "safestream-meilisearch" "safestream-ollama")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
        # Check if service has a health check
        health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "no-healthcheck")

        if [ "$health" = "healthy" ] || [ "$health" = "no-healthcheck" ]; then
            echo "   ✅ $service: Running"
        else
            echo "   ⚠️  $service: Running but unhealthy (status: $health)"
            all_healthy=false
        fi
    else
        echo "   ❌ $service: Not running"
        all_healthy=false
    fi
done

echo ""

# Check PostgreSQL connectivity
echo "🗄️  Database:"
if docker exec safestream-postgres pg_isready -U safestream > /dev/null 2>&1; then
    # Try to connect and count tables
    table_count=$(docker exec safestream-postgres psql -U safestream -d safestream -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "   ✅ PostgreSQL: Connected ($table_count tables)"
else
    echo "   ❌ PostgreSQL: Cannot connect"
    all_healthy=false
fi
echo ""

# Check Redis connectivity
echo "💾 Cache:"
if docker exec safestream-redis redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis: Connected"
else
    echo "   ❌ Redis: Cannot connect"
    all_healthy=false
fi
echo ""

# Check MinIO
echo "📦 Object Storage:"
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "   ✅ MinIO: Running"
    echo "   🌐 Console: http://localhost:9001"
    echo "      User: minio_admin / Password: minio_password"
else
    echo "   ❌ MinIO: Not accessible"
    all_healthy=false
fi
echo ""

# Check Meilisearch
echo "🔍 Search Engine:"
if curl -s http://localhost:7700/health > /dev/null 2>&1; then
    echo "   ✅ Meilisearch: Running"
    echo "   🌐 Dashboard: http://localhost:7700"
else
    echo "   ❌ Meilisearch: Not accessible"
    all_healthy=false
fi
echo ""

# Check Ollama
echo "🤖 AI Service:"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    model_count=$(curl -s http://localhost:11434/api/tags | grep -o '"name"' | wc -l | xargs)
    echo "   ✅ Ollama: Running ($model_count models available)"
else
    echo "   ❌ Ollama: Not accessible"
    all_healthy=false
fi
echo ""

# Check if dev server is running
echo "🌐 Web Application:"
if curl -s http://localhost:3030 > /dev/null 2>&1; then
    echo "   ✅ Next.js Dev Server: Running"
    echo "   🌐 URL: http://localhost:3030"
else
    echo "   ⚠️  Next.js Dev Server: Not running"
    echo "   💡 Start with: pnpm dev"
fi
echo ""

# Overall status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$all_healthy" = true ]; then
    echo "✅ All services are healthy!"
else
    echo "⚠️  Some services need attention"
    echo ""
    echo "💡 Try these commands:"
    echo "   pnpm docker:dev     - Start all Docker services"
    echo "   pnpm docker:logs    - View service logs"
    echo "   pnpm setup          - Run complete setup"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
