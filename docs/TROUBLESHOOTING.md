# Troubleshooting Guide

This guide covers common issues and how to resolve them.

## Quick Diagnostics

Before troubleshooting specific issues, run the health check:

```bash
pnpm health:check
```

This will identify most common problems.

---

## Database Issues

### DB_CONNECTION_FAILED: Database connection failed

**Symptoms:**
- Error: "Database connection failed. PostgreSQL may not be running or DATABASE_URL is incorrect."
- API endpoints return 500 errors
- Web app crashes on startup

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   pnpm docker:status
   ```
   Look for `playpatch-postgres` in the output.

2. **Start Docker services if not running:**
   ```bash
   pnpm docker:dev
   ```

3. **Verify DATABASE_URL:**
   ```bash
   cat apps/web/.env | grep DATABASE_URL
   ```
   Should be: `postgresql://playpatch:playpatch_dev@localhost:5433/playpatch`

4. **Check PostgreSQL logs:**
   ```bash
   pnpm docker:logs | grep postgres
   ```

5. **Reset database if corrupted:**
   ```bash
   pnpm docker:clean
   pnpm dev:all
   ```
   ⚠️ This deletes all data!

---

### DB_MIGRATION_FAILED: Database migration failed

**Symptoms:**
- Error during `pnpm dev:all`
- Schema changes not applied
- Tables or columns missing

**Solutions:**

1. **Check migration status:**
   ```bash
   cd apps/web
   pnpm prisma migrate status
   ```

2. **Run pending migrations:**
   ```bash
   pnpm db:migrate
   ```

3. **If migrations are stuck, reset database:**
   ```bash
   pnpm db:reset
   ```
   ⚠️ This deletes all data and re-runs migrations.

4. **For production, use deploy command:**
   ```bash
   cd apps/web
   pnpm prisma migrate deploy
   ```

---

### DB_RECORD_NOT_FOUND: Record not found

**Symptoms:**
- "Video with ID 'xyz' not found in database"
- "Child profile not found"
- 404 errors in API

**Solutions:**

1. **Verify the ID is correct:**
   - Check URL parameters
   - Use Prisma Studio to browse data: `pnpm db:studio`

2. **Re-seed demo data if empty:**
   ```bash
   pnpm db:seed
   ```

3. **Check for accidental database reset:**
   - Volumes may have been deleted
   - Check Docker volumes: `docker volume ls | grep playpatch`

---

## AI Service Issues

### AI_SERVICE_UNAVAILABLE: AI service unavailable

**Symptoms:**
- Chat panel doesn't respond
- "AI service (ollama) is unavailable or not responding"
- Spinning loading indicator that never completes

**Solutions for Ollama:**

1. **Check if Ollama container is running:**
   ```bash
   docker ps | grep ollama
   ```

2. **Start Ollama if stopped:**
   ```bash
   pnpm docker:dev
   ```

3. **Verify model is downloaded:**
   ```bash
   pnpm ollama:models
   ```
   Should show `llama3.1:8b`.

4. **Download model if missing:**
   ```bash
   pnpm ollama:pull
   ```
   Takes 5-10 minutes (~4.7GB download).

5. **Check OLLAMA_URL:**
   ```bash
   cat apps/web/.env | grep OLLAMA_URL
   ```
   Should be: `http://localhost:11434`

6. **Test Ollama directly:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Should return JSON with available models.

**Solutions for OpenAI:**

1. **Verify API key is set:**
   ```bash
   cat apps/web/.env | grep OPENAI_API_KEY
   ```

2. **Test API key:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. **Check OpenAI status:**
   Visit [status.openai.com](https://status.openai.com)

---

## Storage Issues

### STORAGE_MINIO_UNAVAILABLE: MinIO unavailable

**Symptoms:**
- Cannot upload videos or thumbnails
- Images not loading
- File upload errors

**Solutions:**

1. **Check MinIO status:**
   ```bash
   docker ps | grep minio
   ```

2. **Start MinIO:**
   ```bash
   pnpm docker:dev
   ```

3. **Access MinIO Console:**
   - URL: http://localhost:9001
   - Username: `minio_admin`
   - Password: `minio_password`

4. **Verify buckets exist:**
   Should see: `videos`, `thumbnails`, `avatars`

5. **Recreate buckets if missing:**
   MinIO console → Create Bucket → Name it `videos`, repeat for other buckets.

---

### STORAGE_FILE_TOO_LARGE: File size exceeds limit

**Symptoms:**
- "File size (550MB) exceeds maximum allowed size (500MB)"
- Upload fails partway through

**Solutions:**

1. **Reduce file size:**
   - Use video compression tool
   - Lower resolution or bitrate

2. **Increase limit (if appropriate):**
   Edit `apps/web/.env`:
   ```bash
   MAX_VIDEO_SIZE_MB=1000
   ```

3. **Check available disk space:**
   ```bash
   df -h
   ```
   Ensure sufficient space for video storage.

---

## Video Import Issues

### VIDEO_YTDLP_NOT_INSTALLED: yt-dlp not installed

**Symptoms:**
- Cannot import YouTube videos
- "yt-dlp is not installed"

**Solutions:**

1. **Install yt-dlp:**

   **macOS:**
   ```bash
   brew install yt-dlp
   ```

   **Linux/Ubuntu:**
   ```bash
   pip install yt-dlp
   # or
   sudo apt install yt-dlp
   ```

   **Windows:**
   ```bash
   pip install yt-dlp
   ```

2. **Verify installation:**
   ```bash
   yt-dlp --version
   ```

3. **Restart application:**
   ```bash
   pnpm dev:stop
   pnpm dev:all
   ```

---

### VIDEO_PRIVATE or VIDEO_UNAVAILABLE

**Symptoms:**
- "This video is private and cannot be imported"
- "This video is unavailable or has been removed"

**Solutions:**

1. **Verify video URL is correct:**
   - Open URL in browser
   - Ensure video is publicly accessible

2. **Check video restrictions:**
   - Video must be public (not private or unlisted)
   - Video must not require age verification
   - Video must not be region-locked

3. **Try alternative source:**
   - Download video manually
   - Upload via drag-and-drop instead

---

## Network Issues

### NETWORK_FETCH_FAILED: Network request failed

**Symptoms:**
- Timeout errors
- Connection refused
- Network errors in console

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping google.com
   ```

2. **Verify URL is accessible:**
   ```bash
   curl -I <url>
   ```

3. **Check firewall settings:**
   - Ensure ports 3000, 5433, 6379, 9000, 7700, 11434 are not blocked
   - Temporarily disable firewall to test

4. **Check for proxy/VPN issues:**
   - Some corporate proxies block certain services
   - Try disabling VPN temporarily

---

## Docker Issues

### Docker daemon not running

**Symptoms:**
- "Cannot connect to Docker daemon"
- `pnpm docker:dev` fails immediately

**Solutions:**

1. **Start Docker Desktop:**
   - **macOS:** Open Docker Desktop from Applications
   - **Linux:** `sudo systemctl start docker`
   - **Windows:** Start Docker Desktop

2. **Verify Docker is running:**
   ```bash
   docker info
   ```

3. **Check Docker Desktop settings:**
   - Ensure it's set to start on boot
   - Check resource limits (4GB+ RAM recommended)

---

### Port conflicts

**Symptoms:**
- "Port 3000 is already in use"
- "Bind for 0.0.0.0:5433 failed: port is already allocated"

**Solutions:**

1. **Find process using the port:**
   ```bash
   lsof -i:3000
   # or
   lsof -i:5433
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   # or
   lsof -ti:3000 | xargs kill -9
   ```

3. **Stop conflicting services:**
   - Local PostgreSQL: `brew services stop postgresql`
   - Local Redis: `brew services stop redis`

4. **Change ports in .env if needed:**
   Edit `apps/web/.env` to use different ports.

---

## Authentication Issues

### AUTH_SESSION_EXPIRED: Session expired

**Symptoms:**
- Redirected to login unexpectedly
- "Your session has expired"

**Solutions:**

1. **Log in again:**
   - Refresh page
   - Enter credentials

2. **Check NEXTAUTH_SECRET:**
   ```bash
   cat apps/web/.env | grep NEXTAUTH_SECRET
   ```
   Should be a long random string.

3. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application → Cookies → Delete all for localhost

---

### AUTH_PIN_INCORRECT: Incorrect PIN

**Symptoms:**
- "Incorrect PIN. Access denied."
- Cannot access child profile

**Solutions:**

1. **Reset PIN via Prisma Studio:**
   ```bash
   pnpm db:studio
   ```
   Navigate to `ChildProfile` → Edit → Set new PIN

2. **Default demo PINs:**
   - Usually `1234` or not set

---

## Performance Issues

### Slow application

**Symptoms:**
- Pages load slowly
- Video playback stutters
- Long wait times

**Solutions:**

1. **Check Docker resource usage:**
   ```bash
   docker stats
   ```

2. **Increase Docker resources:**
   - Docker Desktop → Settings → Resources
   - Increase CPU and RAM allocation

3. **Check disk space:**
   ```bash
   df -h
   ```
   Free up space if needed.

4. **Optimize database:**
   ```bash
   cd apps/web
   pnpm prisma db execute --stdin <<< "VACUUM ANALYZE;"
   ```

5. **Clear Docker build cache:**
   ```bash
   docker system prune -a
   ```

---

## Installation Issues

### pnpm install fails

**Symptoms:**
- Dependency installation errors
- "Cannot find module"

**Solutions:**

1. **Clear pnpm cache:**
   ```bash
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   ```
   Must be 20.0.0 or higher.

3. **Update pnpm:**
   ```bash
   npm install -g pnpm@latest
   ```

4. **Check for disk space:**
   ```bash
   df -h
   ```
   node_modules can be large (~500MB).

---

## Getting Help

If you've tried these solutions and still have issues:

1. **Check logs:**
   ```bash
   pnpm docker:logs
   tail -f .workers.log
   ```

2. **Run health check:**
   ```bash
   pnpm health:check
   ```

3. **Search existing issues:**
   [GitHub Issues](https://github.com/yourusername/playpatch/issues)

4. **Create a new issue:**
   Include:
   - Error message (full text)
   - Output of `pnpm health:check`
   - Docker logs
   - Steps to reproduce
   - Operating system

5. **Join the community:**
   - Discord (if available)
   - GitHub Discussions

---

## Error Code Reference

Quick reference for all error codes:

| Code | Description | Quick Fix |
|------|-------------|-----------|
| `DB_CONNECTION_FAILED` | Database not running | `pnpm docker:dev` |
| `DB_MIGRATION_FAILED` | Schema mismatch | `pnpm db:migrate` |
| `DB_RECORD_NOT_FOUND` | Missing data | Check ID, use `pnpm db:studio` |
| `AI_SERVICE_UNAVAILABLE` | Ollama/OpenAI down | `pnpm ollama:pull` |
| `STORAGE_MINIO_UNAVAILABLE` | MinIO not running | `pnpm docker:dev` |
| `STORAGE_FILE_TOO_LARGE` | File too big | Increase `MAX_VIDEO_SIZE_MB` |
| `VIDEO_YTDLP_NOT_INSTALLED` | yt-dlp missing | `pip install yt-dlp` |
| `VIDEO_PRIVATE` | Video not public | Use public video |
| `NETWORK_FETCH_FAILED` | Network issue | Check connection, firewall |
| `AUTH_SESSION_EXPIRED` | Logged out | Log in again |
| `CONFIG_ENV_VAR_MISSING` | Missing .env variable | Copy from `.env.example` |

---

**Last Updated:** 2026-02-02
