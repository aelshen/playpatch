#!/bin/bash

# Reset database to fresh state with seed data

set -e

echo "🔄 SafeStream Kids - Database Reset"
echo "===================================="
echo ""

cd "$(dirname "$0")/../.."

# Confirm action
read -p "⚠️  This will delete ALL data and reset the database. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "1️⃣ Dropping database..."
docker exec safestream-postgres psql -U safestream -d postgres -c "DROP DATABASE IF EXISTS safestream;" || true
echo "✅ Database dropped"
echo ""

echo "2️⃣ Creating database..."
docker exec safestream-postgres psql -U safestream -d postgres -c "CREATE DATABASE safestream;"
echo "✅ Database created"
echo ""

echo "3️⃣ Pushing schema..."
cd apps/web
pnpm prisma db push --skip-generate
echo "✅ Schema pushed"
echo ""

echo "4️⃣ Seeding database..."
pnpm tsx prisma/seed.ts
cd ../..
echo "✅ Database seeded"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Database reset complete!"
echo ""
echo "🔐 Demo Credentials:"
echo "   Email:    admin@safestream.local"
echo "   Password: password123"
echo ""
echo "👶 Child Profiles:"
echo "   • Tara (3 years old, Toddler Mode)"
echo "   • Eddie (6 years old, Explorer Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
