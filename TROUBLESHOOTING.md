# SafeStream Kids - Troubleshooting Guide
**Quick reference for common issues and solutions**

---

## 📋 Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Setup & Installation Issues](#setup--installation-issues)
3. [Docker & Services Issues](#docker--services-issues)
4. [Database Issues](#database-issues)
5. [Application Issues](#application-issues)
6. [Performance Issues](#performance-issues)
7. [Testing Issues](#testing-issues)
8. [Network & Port Issues](#network--port-issues)
9. [Storage Issues](#storage-issues)
10. [Getting More Help](#getting-more-help)

---

## Quick Diagnostics

**First, run the health check:**
```bash
pnpm health:check
```

This will show you which services are having problems. Then jump to the relevant section below.

**Check all logs:**
```bash
# All Docker service logs
pnpm docker:logs

# Just web app logs
pnpm docker:logs:app

# Just one service
docker logs safestream-postgres
docker logs safestream-redis
docker logs safestream-minio
```

---

## Setup & Installation Issues

### Issue: `pnpm: command not found`

**Cause:** pnpm is not installed or not in PATH

**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

---

### Issue: `Node version must be >= 20.0.0`

**Cause:** Your Node.js version is too old

**Solution:**
```bash
# Check current version
node --version

# Install Node.js 20+ from nodejs.org
# Or use nvm:
nvm install 20
nvm use 20
nvm alias default 20
```

---

### Issue: `Docker is not running`

**Cause:** Docker Desktop is not started or Docker daemon is not running

**Solution:**

**macOS/Windows:**
1. Open Docker Desktop application
2. Wait for it to fully start (whale icon in menu bar)
3. Run `docker ps` to verify

**Linux:**
```bash
# Start Docker daemon
sudo systemctl start docker

# Enable auto-start
sudo systemctl enable docker
```

---

### Issue: `pnpm install` fails with EACCES errors

**Cause:** Permission issues with npm/pnpm global directory

**Solution:**
```bash
# Option 1: Fix npm directory permissions (Linux/macOS)
sudo chown -R $USER ~/.npm
sudo chown -R $USER ~/.pnpm-store

# Option 2: Use a different package manager directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

### Issue: Setup script fails with "NEXTAUTH_SECRET is not set"

**Cause:** Environment file not created or missing secret

**Solution:**
```bash
# Generate a secure secret
openssl rand -base64 32

# Create/edit .env file
nano .env

# Add this line (paste your generated secret):
NEXTAUTH_SECRET=your_generated_secret_here

# Or use the setup script to auto-generate:
pnpm setup:env
```

---

## Docker & Services Issues

### Issue: `Error: Port 5433 is already in use`

**Cause:** Another PostgreSQL instance or service is using port 5433

**Solution:**

**Option 1: Stop conflicting service**
```bash
# Find what's using the port
lsof -i :5433

# Stop the service (example: local PostgreSQL)
brew services stop postgresql  # macOS
sudo systemctl stop postgresql # Linux
```

**Option 2: Change the port in docker-compose.yml**
```yaml
# infrastructure/compose/docker-compose.yml
postgres:
  ports:
    - "5434:5432"  # Use 5434 instead

# Then update DATABASE_URL in .env:
DATABASE_URL=postgresql://safestream:safestream_dev@localhost:5434/safestream
```

---

### Issue: `Docker services start but show as unhealthy`

**Cause:** Services are starting but not passing health checks

**Solution:**
```bash
# Wait longer (services can take 30-60 seconds)
sleep 30
pnpm health:check

# Check specific service logs
docker logs safestream-postgres

# Check service health directly
docker ps --filter "name=safestream-postgres"

# Restart unhealthy service
docker restart safestream-postgres
```

---

### Issue: `PostgreSQL: password authentication failed`

**Cause:** Database credentials mismatch between .env and docker-compose.yml

**Solution:**
```bash
# Check credentials in docker-compose.yml
cat infrastructure/compose/docker-compose.yml | grep -A 5 "POSTGRES"

# Check credentials in .env
grep DATABASE_URL .env

# Make sure they match! Default is:
# User: safestream
# Password: safestream_dev
# Database: safestream
# Port: 5433

# If they don't match, update .env:
DATABASE_URL=postgresql://safestream:safestream_dev@localhost:5433/safestream

# Then restart services
pnpm docker:restart
```

---

### Issue: `Redis connection refused`

**Cause:** Redis not started or wrong port

**Solution:**
```bash
# Check if Redis is running
docker ps --filter "name=safestream-redis"

# Test Redis connection
docker exec safestream-redis redis-cli ping
# Should return: PONG

# If not running, start it
pnpm docker:dev

# Check Redis URL in .env
grep REDIS_URL .env
# Should be: redis://localhost:6379
```

---

### Issue: `MinIO access denied`

**Cause:** Wrong credentials or bucket not created

**Solution:**
```bash
# Check MinIO is running
docker ps --filter "name=safestream-minio"

# Check MinIO credentials in .env
grep MINIO .env

# Access MinIO console
open http://localhost:9001
# Login: minio_admin / minio_password

# Manually create bucket if needed:
# 1. Login to console
# 2. Create bucket named "safestream-videos"
# 3. Create bucket named "safestream-thumbnails"

# Or restart services to auto-create
pnpm docker:restart
```

---

### Issue: `Meilisearch: invalid API key`

**Cause:** Master key mismatch

**Solution:**
```bash
# Check master key in .env
grep MEILI .env

# Should be:
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=master_key_change_me

# Restart services after fixing
pnpm docker:restart
```

---

### Issue: `Out of disk space` errors

**Cause:** Docker volumes consuming too much space

**Solution:**
```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes

# WARNING: This removes ALL unused Docker data
# Only do this if you're sure!

# Alternative: Clean only this project
pnpm docker:clean  # Removes volumes
pnpm clean:all     # Nuclear option
```

---

## Database Issues

### Issue: `Prisma migration fails`

**Cause:** Database schema conflict or connection issue

**Solution:**

**Option 1: Reset database (DELETES ALL DATA)**
```bash
pnpm db:reset
```

**Option 2: Manual migration**
```bash
# Check migration status
cd apps/web
pnpm prisma migrate status

# Force push schema (dev only!)
pnpm prisma db push --accept-data-loss

# Or create new migration
pnpm prisma migrate dev --name fix_schema
```

**Option 3: Clean slate**
```bash
# Stop and remove PostgreSQL volume
pnpm docker:down
docker volume rm safestream_postgres_data

# Restart and migrate
pnpm docker:dev
sleep 30
pnpm db:migrate
```

---

### Issue: `Cannot find Prisma Client`

**Cause:** Prisma Client not generated after schema changes

**Solution:**
```bash
# Generate Prisma Client
pnpm db:generate

# Or run the postinstall hook
cd apps/web
pnpm install
```

---

### Issue: `Database is locked` or `Too many connections`

**Cause:** Too many concurrent connections or stuck connections

**Solution:**
```bash
# Restart PostgreSQL
docker restart safestream-postgres

# Check active connections
docker exec -it safestream-postgres psql -U safestream -d safestream -c "SELECT count(*) FROM pg_stat_activity;"

# Kill stuck connections (if needed)
docker exec -it safestream-postgres psql -U safestream -d safestream -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safestream';"
```

---

### Issue: `Prisma Studio won't open`

**Cause:** Port 5555 already in use or database connection issue

**Solution:**
```bash
# Check what's using port 5555
lsof -i :5555

# Kill the process if needed
kill <PID>

# Verify database connection first
pnpm health:check

# Then try again
pnpm db:studio
```

---

## Application Issues

### Issue: `Cannot connect to localhost:3000`

**Cause:** Web app not started or crashed

**Solution:**
```bash
# Check if web app is running
curl http://localhost:3000

# Check for port conflicts
lsof -i :3000

# Restart web app
pnpm dev

# Check logs for errors
# Look in terminal where you ran 'pnpm dev'
```

---

### Issue: `NEXTAUTH_URL mismatch` errors

**Cause:** NextAuth URL configuration wrong

**Solution:**
```bash
# Check .env file
grep NEXTAUTH .env

# Should be:
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret>

# Update if wrong, then restart
pnpm dev
```

---

### Issue: `Session errors` or `Can't stay logged in`

**Cause:** Redis not working or NextAuth secret changed

**Solution:**
```bash
# Check Redis is running
pnpm health:check

# Clear Redis cache
docker exec safestream-redis redis-cli FLUSHALL

# Clear browser cookies
# Chrome: Settings > Privacy > Clear browsing data > Cookies

# Restart web app
pnpm dev
```

---

### Issue: `API route returns 500 error`

**Cause:** Various - check logs for details

**Solution:**
```bash
# Check API health endpoint
curl http://localhost:3000/api/health | jq

# Check web app logs (where you ran pnpm dev)
# Look for error stack traces

# Common fixes:
# 1. Restart services
pnpm docker:restart

# 2. Check database connection
pnpm health:check

# 3. Check environment variables
cat .env

# 4. Clear cache
docker exec safestream-redis redis-cli FLUSHALL
```

---

### Issue: `Workers not processing jobs`

**Cause:** Workers not started or Redis connection issue

**Solution:**
```bash
# Check if workers are running
ps aux | grep workers

# Start workers
pnpm workers:dev

# Or use dev:all to start everything
pnpm dev:all

# Check Redis queue
docker exec safestream-redis redis-cli KEYS "bull:*"

# Check worker logs
# Look in terminal where you ran 'pnpm workers:dev'
```

---

### Issue: `Video upload fails` or `Transcoding stuck`

**Cause:** Storage issue, ffmpeg missing, or worker problem

**Solution:**
```bash
# Check storage is accessible
pnpm health:check

# Check workers are running
ps aux | grep workers

# Check ffmpeg is available
docker exec safestream-web which ffmpeg

# Check storage directory permissions (if using local storage)
ls -la ./storage

# Fix permissions if needed
chmod -R 755 ./storage

# Restart workers
pnpm workers:dev
```

---

## Performance Issues

### Issue: `Application is slow` or `Page loads timeout`

**Cause:** Various performance bottlenecks

**Solution:**

**1. Check resource usage:**
```bash
# Docker stats
docker stats

# System resources
top  # or htop
```

**2. Check database performance:**
```bash
# Check slow queries
docker exec -it safestream-postgres psql -U safestream -d safestream -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Analyze database
pnpm db:studio
```

**3. Check Redis memory:**
```bash
docker exec safestream-redis redis-cli INFO memory
```

**4. Restart services to clear caches:**
```bash
pnpm docker:restart
```

---

### Issue: `High memory usage` or `Out of memory`

**Cause:** Memory leak or insufficient resources

**Solution:**

**1. Increase Docker memory:**
- Docker Desktop > Settings > Resources > Memory
- Increase to at least 8GB

**2. Restart services:**
```bash
pnpm docker:restart
```

**3. Check for memory leaks:**
```bash
docker stats --no-stream
```

**4. Disable Ollama if not needed:**
```yaml
# Comment out in docker-compose.dev.yml
# ollama:
#   ...
```

---

## Testing Issues

### Issue: `Tests fail with connection errors`

**Cause:** Tests trying to connect to real database

**Solution:**
```bash
# Make sure test environment is set
export NODE_ENV=test

# Check jest.setup.js has test DATABASE_URL
cat jest.setup.js | grep DATABASE_URL

# Run tests
pnpm test
```

---

### Issue: `Jest: Cannot find module '@/...'`

**Cause:** Module resolution issue

**Solution:**
```bash
# Check jest.config.js has correct moduleNameMapper
cat jest.config.js | grep moduleNameMapper

# Should have:
# moduleNameMapper: {
#   '^@/(.*)$': '<rootDir>/src/$1',
# }

# Clear Jest cache
pnpm test --clearCache

# Run tests again
pnpm test
```

---

### Issue: `Tests hang or timeout`

**Cause:** Async operations not completing or database locks

**Solution:**
```bash
# Increase timeout in jest.config.js
# testTimeout: 10000,

# Or per-test:
# jest.setTimeout(10000);

# Check for missing awaits in test code
# Make sure all Prisma mocks are cleared
```

---

### Issue: `Coverage not generating`

**Cause:** Coverage configuration issue

**Solution:**
```bash
# Check jest.config.js has collectCoverageFrom
cat jest.config.js | grep collectCoverage

# Clean and regenerate
rm -rf coverage
pnpm test:coverage
```

---

## Network & Port Issues

### Issue: `Port already in use` errors

**Cause:** Service trying to use a port that's taken

**Solution:**

**Find what's using a port:**
```bash
# Check specific port
lsof -i :3000   # Web app
lsof -i :5433   # PostgreSQL
lsof -i :6379   # Redis
lsof -i :9000   # MinIO
lsof -i :7700   # Meilisearch

# Kill process using port
kill -9 <PID>
```

**Common port conflicts:**
- 3000: Another Node.js app → Change with `PORT=3001 pnpm dev`
- 5433: Local PostgreSQL → Change in docker-compose.yml
- 6379: Local Redis → Stop with `brew services stop redis`

---

### Issue: `Cannot access services from host`

**Cause:** Docker network issue or firewall

**Solution:**
```bash
# Check Docker network
docker network ls
docker network inspect safestream_default

# Restart Docker networking
pnpm docker:down
pnpm docker:dev

# Check firewall (macOS)
# System Preferences > Security & Privacy > Firewall
# Allow Docker
```

---

## Storage Issues

### Issue: `Cannot write to storage directory`

**Cause:** Permission issues with local storage path

**Solution:**
```bash
# Check storage path in .env
grep LOCAL_STORAGE_PATH .env

# Check directory exists and is writable
ls -la ./storage

# Create if missing
mkdir -p ./storage/videos
mkdir -p ./storage/thumbnails

# Fix permissions
chmod -R 755 ./storage
chown -R $USER ./storage
```

---

### Issue: `Videos won't play` or `404 on video files`

**Cause:** Storage configuration issue or files not uploaded

**Solution:**

**For local storage:**
```bash
# Check files exist
ls -la ./storage/videos/

# Check storage type in .env
grep STORAGE_TYPE .env
# Should be: STORAGE_TYPE=local

# Check Next.js static file serving
# Files in ./storage should be accessible at /storage/*
```

**For MinIO:**
```bash
# Check MinIO is running
docker ps --filter "name=safestream-minio"

# Access MinIO console
open http://localhost:9001

# Verify buckets exist:
# - safestream-videos
# - safestream-thumbnails

# Check bucket permissions (should be public read)
```

---

### Issue: `Disk space full`

**Cause:** Too many videos or logs

**Solution:**
```bash
# Check disk usage
df -h
du -sh ./storage

# Clean up old videos (carefully!)
# Use the app's admin interface to delete unwanted videos

# Clean Docker logs
docker system prune -a

# Clean old Docker volumes
docker volume prune
```

---

## Getting More Help

### Check Documentation
- [Setup Guide](./SETUP_GUIDE.md) - Complete installation guide
- [Testing Guide](./TESTING_GUIDE.md) - Testing help
- [Code Review Report](./CODE_REVIEW_REPORT.md) - Known issues
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Configuration reference

### Debugging Steps

1. **Run health check:**
   ```bash
   pnpm health:check
   ```

2. **Check all logs:**
   ```bash
   pnpm docker:logs
   ```

3. **Verify environment:**
   ```bash
   cat .env
   ```

4. **Check service status:**
   ```bash
   pnpm docker:status
   ```

5. **Try clean restart:**
   ```bash
   pnpm docker:restart
   ```

6. **Nuclear option (last resort):**
   ```bash
   pnpm clean:all
   pnpm setup
   ```

### Report an Issue

When reporting issues, include:

1. **System Information:**
   ```bash
   node --version
   pnpm --version
   docker --version
   docker compose version
   uname -a  # OS info
   ```

2. **Health Check Output:**
   ```bash
   pnpm health:check
   ```

3. **Relevant Logs:**
   ```bash
   pnpm docker:logs > logs.txt
   ```

4. **Steps to Reproduce**

5. **Expected vs Actual Behavior**

### Community Support

- **GitHub Issues:** [Report bugs or ask questions](https://github.com/yourusername/safestream-kids/issues)
- **Discussions:** [Community discussions](https://github.com/yourusername/safestream-kids/discussions)
- **Email:** support@example.com

---

## Common Error Messages

### `Error: connect ECONNREFUSED`
→ Service not running. Check `pnpm docker:status`

### `Error: Transaction already started`
→ Database connection issue. Restart app with `pnpm dev`

### `Error: NEXTAUTH_SECRET must be set`
→ Missing environment variable. Run `pnpm setup:env`

### `Error: P2002: Unique constraint failed`
→ Trying to insert duplicate data. Check your input data

### `Error: FFmpeg not found`
→ FFmpeg not installed. Reinstall web Docker container

### `Error: Cannot find module`
→ Dependencies not installed. Run `pnpm install`

### `Error: Port 3000 already in use`
→ Another app using port 3000. Kill it or use different port

---

**Last Updated:** January 10, 2026

**Need more help?** Check the [Setup Guide](./SETUP_GUIDE.md) or [open an issue](https://github.com/yourusername/safestream-kids/issues).
