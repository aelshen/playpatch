# SafeStream Kids - Environment Variables Reference
**Complete guide to configuring SafeStream Kids**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Required Variables](#required-variables)
3. [Application Settings](#application-settings)
4. [Database Configuration](#database-configuration)
5. [Cache & Queue (Redis)](#cache--queue-redis)
6. [Storage Configuration](#storage-configuration)
7. [Search (Meilisearch)](#search-meilisearch)
8. [AI/LLM Configuration](#aillm-configuration)
9. [Authentication](#authentication)
10. [Email Configuration](#email-configuration)
11. [Production Settings](#production-settings)
12. [Feature Flags](#feature-flags)
13. [Media Processing](#media-processing)
14. [Rate Limiting](#rate-limiting)
15. [Example Configurations](#example-configurations)

---

## Quick Start

**Minimum configuration for local development:**

```bash
# Copy example file
cp .env.example .env

# Generate authentication secret
openssl rand -base64 32

# Edit .env and set NEXTAUTH_SECRET
nano .env
```

**Required changes:**
- Set `NEXTAUTH_SECRET` to generated value

**Everything else has working defaults!**

---

## Required Variables

These **must** be set for the application to work:

### NEXTAUTH_SECRET
- **Required:** YES (Critical)
- **Type:** String (32+ characters)
- **Description:** Secret key for NextAuth.js session encryption
- **Default:** None (must be set)
- **Generate:** `openssl rand -base64 32`

```bash
NEXTAUTH_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678
```

⚠️ **Security:** Never commit this to version control. Change it in production.

### DATABASE_URL
- **Required:** YES
- **Type:** PostgreSQL connection string
- **Description:** Database connection URL
- **Default:** `postgresql://safestream:safestream_dev@localhost:5433/safestream`
- **Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

```bash
DATABASE_URL=postgresql://safestream:safestream_dev@localhost:5433/safestream
```

### NEXTAUTH_URL
- **Required:** YES
- **Type:** URL
- **Description:** Base URL of your application for NextAuth
- **Default:** `http://localhost:3000`
- **Production:** Must match your domain

```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://safestream.yourdomain.com
```

---

## Application Settings

### NODE_ENV
- **Required:** No
- **Type:** `development` | `production` | `test`
- **Description:** Application environment
- **Default:** `development`

```bash
NODE_ENV=development  # For local dev
NODE_ENV=production   # For production
NODE_ENV=test         # For testing
```

**Effects:**
- `development`: Hot reload, verbose logging, debug tools
- `production`: Optimized builds, minimal logging
- `test`: Test database, mocked services

### NEXT_PUBLIC_APP_URL
- **Required:** No
- **Type:** URL
- **Description:** Public-facing application URL (used in client-side code)
- **Default:** `http://localhost:3000`

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Database Configuration

### DB_PASSWORD
- **Required:** No (used by docker-compose)
- **Type:** String
- **Description:** PostgreSQL password for docker-compose setup
- **Default:** `safestream_dev`

```bash
DB_PASSWORD=safestream_dev
```

**Note:** This is used by Docker Compose to set up PostgreSQL. The same password should be in `DATABASE_URL`.

### DATABASE_URL (detailed)

**Format Components:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Default Setup:**
- **User:** `safestream`
- **Password:** `safestream_dev`
- **Host:** `localhost`
- **Port:** `5433` (avoiding conflict with local PostgreSQL on 5432)
- **Database:** `safestream`

**Production Example:**
```bash
DATABASE_URL=postgresql://safestream_prod:secure_password@postgres.example.com:5432/safestream_prod
```

**With SSL:**
```bash
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
```

---

## Cache & Queue (Redis)

### REDIS_URL
- **Required:** YES (for production features)
- **Type:** Redis connection string
- **Description:** Redis connection for caching and job queue
- **Default:** `redis://localhost:6379`

```bash
REDIS_URL=redis://localhost:6379
```

**With Authentication:**
```bash
REDIS_URL=redis://:password@localhost:6379
```

**With Database Selection:**
```bash
REDIS_URL=redis://localhost:6379/0
```

**Production (TLS):**
```bash
REDIS_URL=rediss://default:password@redis.example.com:6380
```

**What Redis is used for:**
- Session storage
- Rate limiting
- Background job queue (BullMQ)
- Application cache

---

## Storage Configuration

SafeStream Kids supports two storage backends: **Local Filesystem** or **MinIO/S3**.

### STORAGE_TYPE
- **Required:** No
- **Type:** `local` | `minio`
- **Description:** Which storage backend to use
- **Default:** `local`

```bash
STORAGE_TYPE=local   # Use local filesystem
STORAGE_TYPE=minio   # Use MinIO/S3
```

### Local Filesystem Storage

#### LOCAL_STORAGE_PATH
- **Required:** When `STORAGE_TYPE=local`
- **Type:** Path
- **Description:** Directory for storing videos/thumbnails
- **Default:** `./storage`

```bash
LOCAL_STORAGE_PATH=./storage
```

**Directory Structure:**
```
./storage/
├── videos/
│   ├── original/
│   └── hls/
├── thumbnails/
└── avatars/
```

**Permissions:** Directory must be writable by the application.

### MinIO / S3 Storage

#### MINIO_ENDPOINT
- **Required:** When `STORAGE_TYPE=minio`
- **Type:** Hostname
- **Description:** MinIO server hostname
- **Default:** `localhost`

```bash
MINIO_ENDPOINT=localhost        # Local MinIO
MINIO_ENDPOINT=minio.internal   # Internal network
```

#### MINIO_PORT
- **Required:** When `STORAGE_TYPE=minio`
- **Type:** Number
- **Description:** MinIO server port
- **Default:** `9000`

```bash
MINIO_PORT=9000
```

#### MINIO_USE_SSL
- **Required:** No
- **Type:** Boolean
- **Description:** Use HTTPS for MinIO connection
- **Default:** `false`

```bash
MINIO_USE_SSL=false  # Development
MINIO_USE_SSL=true   # Production
```

#### MINIO_ACCESS_KEY
- **Required:** When `STORAGE_TYPE=minio`
- **Type:** String
- **Description:** MinIO access key (like AWS Access Key ID)
- **Default:** `minio_admin`

```bash
MINIO_ACCESS_KEY=minio_admin
```

#### MINIO_SECRET_KEY
- **Required:** When `STORAGE_TYPE=minio`
- **Type:** String
- **Description:** MinIO secret key (like AWS Secret Access Key)
- **Default:** `minio_password`

```bash
MINIO_SECRET_KEY=minio_password
```

⚠️ **Security:** Change default credentials in production!

#### MINIO_BUCKET_VIDEOS
- **Required:** No
- **Type:** String
- **Description:** Bucket name for video files
- **Default:** `videos`

```bash
MINIO_BUCKET_VIDEOS=videos
```

#### MINIO_BUCKET_THUMBNAILS
- **Required:** No
- **Type:** String
- **Description:** Bucket name for thumbnail images
- **Default:** `thumbnails`

```bash
MINIO_BUCKET_THUMBNAILS=thumbnails
```

#### MINIO_BUCKET_AVATARS
- **Required:** No
- **Type:** String
- **Description:** Bucket name for user avatars
- **Default:** `avatars`

```bash
MINIO_BUCKET_AVATARS=avatars
```

### AWS S3 Configuration

For production S3 storage, use these instead:

```bash
STORAGE_TYPE=minio
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
MINIO_BUCKET_VIDEOS=my-safestream-videos
MINIO_BUCKET_THUMBNAILS=my-safestream-thumbnails
```

**Other S3-compatible services:**
- Backblaze B2
- DigitalOcean Spaces
- Wasabi
- Cloudflare R2

---

## Search (Meilisearch)

### MEILISEARCH_URL
- **Required:** For search functionality
- **Type:** URL
- **Description:** Meilisearch server URL
- **Default:** `http://localhost:7700`

```bash
MEILISEARCH_URL=http://localhost:7700
```

### MEILISEARCH_KEY
- **Required:** Yes (if using Meilisearch)
- **Type:** String
- **Description:** Meilisearch master key
- **Default:** `master_key_change_me`

```bash
MEILISEARCH_KEY=master_key_change_me
```

⚠️ **Security:** Change this in production! Generate with:
```bash
openssl rand -base64 32
```

**What Meilisearch is used for:**
- Full-text video search
- Content filtering
- Recommendations

---

## AI/LLM Configuration

SafeStream Kids supports two AI providers: **Ollama** (local) or **OpenAI** (cloud).

### AI_PROVIDER
- **Required:** For AI features
- **Type:** `ollama` | `openai`
- **Description:** Which AI provider to use
- **Default:** `ollama`

```bash
AI_PROVIDER=ollama   # Local AI with Ollama
AI_PROVIDER=openai   # Cloud AI with OpenAI
```

### Ollama Configuration

#### OLLAMA_URL
- **Required:** When `AI_PROVIDER=ollama`
- **Type:** URL
- **Description:** Ollama server URL
- **Default:** `http://localhost:11434`

```bash
OLLAMA_URL=http://localhost:11434
```

#### OLLAMA_MODEL
- **Required:** When `AI_PROVIDER=ollama`
- **Type:** String
- **Description:** Ollama model to use
- **Default:** `llama3.1:8b`

```bash
OLLAMA_MODEL=llama3.1:8b     # Recommended, 8GB
OLLAMA_MODEL=mistral:7b      # Alternative, 7GB
OLLAMA_MODEL=phi:2.7b        # Smaller, 2.7GB
```

**Available Models:**
- Download with: `docker exec safestream-ollama ollama pull <model>`
- List with: `pnpm ollama:models`

### OpenAI Configuration

#### OPENAI_API_KEY
- **Required:** When `AI_PROVIDER=openai`
- **Type:** String
- **Description:** OpenAI API key
- **Default:** None

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-abcd1234efgh5678...
```

⚠️ **Cost:** OpenAI charges per token. Monitor usage!

**What AI is used for:**
- AI Assistant (answering children's questions)
- Content safety checking
- Automatic categorization
- Transcript generation (if enabled)

---

## Authentication

### NEXTAUTH_SECRET (detailed)
- **Required:** YES (Critical)
- **Type:** String (32+ random characters)
- **Description:** Encrypts session tokens and signs cookies
- **Security:** Must be secret, random, and never committed to git

**Generate:**
```bash
openssl rand -base64 32
```

**Example:**
```bash
NEXTAUTH_SECRET=dGhpc19pc19hX3Zlcnlfc2VjdXJlX3JhbmRvbV9zdHJpbmc=
```

**Production:** Use different secrets for dev/staging/production.

### NEXTAUTH_URL (detailed)
- **Required:** YES
- **Type:** URL
- **Description:** Canonical URL for NextAuth callbacks
- **Must Match:** Your actual domain/URL

```bash
# Local Development
NEXTAUTH_URL=http://localhost:3000

# Staging
NEXTAUTH_URL=https://staging.safestream.com

# Production
NEXTAUTH_URL=https://safestream.yourdomain.com
```

⚠️ **Important:** OAuth callbacks won't work if this is wrong!

---

## Email Configuration

For weekly digest emails and notifications.

### SMTP_HOST
- **Required:** For email features
- **Type:** Hostname
- **Description:** SMTP server hostname
- **Default:** None

```bash
SMTP_HOST=smtp.gmail.com
SMTP_HOST=smtp.sendgrid.net
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # AWS SES
```

### SMTP_PORT
- **Required:** For email features
- **Type:** Number
- **Description:** SMTP server port
- **Default:** `587`

```bash
SMTP_PORT=587   # TLS (recommended)
SMTP_PORT=465   # SSL
SMTP_PORT=25    # Unencrypted (not recommended)
```

### SMTP_SECURE
- **Required:** No
- **Type:** Boolean
- **Description:** Use SSL/TLS
- **Default:** `false` (will use STARTTLS on port 587)

```bash
SMTP_SECURE=false  # Port 587 with STARTTLS
SMTP_SECURE=true   # Port 465 with SSL
```

### SMTP_USER
- **Required:** For email features
- **Type:** String
- **Description:** SMTP authentication username
- **Default:** None

```bash
SMTP_USER=your_email@gmail.com
SMTP_USER=apikey  # For SendGrid
```

### SMTP_PASS
- **Required:** For email features
- **Type:** String
- **Description:** SMTP authentication password
- **Default:** None

```bash
SMTP_PASS=your_password
SMTP_PASS=SG.abc123...  # SendGrid API key
```

⚠️ **Security:** Use app-specific passwords or API keys, not your actual password!

### EMAIL_FROM
- **Required:** For email features
- **Type:** Email address with name
- **Description:** "From" address for outgoing emails
- **Default:** None

```bash
EMAIL_FROM=SafeStream Kids <noreply@yourdomain.com>
```

**Example Providers:**

**Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=SafeStream Kids <your_email@gmail.com>
```

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
EMAIL_FROM=SafeStream Kids <noreply@yourdomain.com>
```

---

## Production Settings

### DOMAIN
- **Required:** For production deployment
- **Type:** Domain name
- **Description:** Your production domain
- **Default:** None

```bash
DOMAIN=safestream.yourdomain.com
```

**Used by:**
- Traefik reverse proxy
- SSL certificate generation
- CORS configuration

### ACME_EMAIL
- **Required:** For automatic SSL
- **Type:** Email address
- **Description:** Email for Let's Encrypt notifications
- **Default:** None

```bash
ACME_EMAIL=admin@yourdomain.com
```

**Used for:**
- SSL certificate expiry notifications
- Terms of Service acceptance

---

## Feature Flags

Enable or disable specific features:

### ENABLE_AI
- **Required:** No
- **Type:** Boolean
- **Description:** Enable AI Assistant feature
- **Default:** `true`

```bash
ENABLE_AI=true   # AI chat enabled
ENABLE_AI=false  # AI chat disabled
```

**When disabled:**
- AI chat interface hidden
- No LLM API calls made
- Saves resources if not needed

### ENABLE_TRANSCRIPTION
- **Required:** No
- **Type:** Boolean
- **Description:** Enable automatic video transcription
- **Default:** `true`

```bash
ENABLE_TRANSCRIPTION=true   # Auto-generate transcripts
ENABLE_TRANSCRIPTION=false  # No transcription
```

**When enabled:**
- Uses Whisper (local) or speech-to-text API
- Enables searchable transcripts
- Improves content safety

### ENABLE_WEEKLY_DIGEST
- **Required:** No
- **Type:** Boolean
- **Description:** Enable weekly summary emails
- **Default:** `false`

```bash
ENABLE_WEEKLY_DIGEST=true   # Send weekly emails
ENABLE_WEEKLY_DIGEST=false  # No digest emails
```

**Requirements:**
- SMTP configuration must be set
- Cron job or worker must be running

---

## Media Processing

### WHISPER_MODEL
- **Required:** No
- **Type:** String
- **Description:** Whisper model size for transcription
- **Default:** `base`

```bash
WHISPER_MODEL=tiny    # Fastest, least accurate (~1GB)
WHISPER_MODEL=base    # Good balance (~1GB)
WHISPER_MODEL=small   # Better accuracy (~2GB)
WHISPER_MODEL=medium  # High accuracy (~5GB)
WHISPER_MODEL=large   # Best accuracy (~10GB)
```

**Trade-off:** Larger models are more accurate but slower.

### MAX_VIDEO_SIZE_MB
- **Required:** No
- **Type:** Number (MB)
- **Description:** Maximum video file size for upload
- **Default:** `500`

```bash
MAX_VIDEO_SIZE_MB=500   # 500MB limit
MAX_VIDEO_SIZE_MB=1000  # 1GB limit
MAX_VIDEO_SIZE_MB=100   # 100MB limit
```

**Considerations:**
- Larger files take longer to upload/process
- Require more disk space
- Affect user experience

### TRANSCODE_QUALITY
- **Required:** No
- **Type:** String
- **Description:** Target quality for video transcoding
- **Default:** `720p`

```bash
TRANSCODE_QUALITY=480p   # Lower quality, smaller files
TRANSCODE_QUALITY=720p   # HD quality (recommended)
TRANSCODE_QUALITY=1080p  # Full HD (larger files)
```

**Effects:**
- Storage space usage
- Bandwidth requirements
- Playback experience

---

## Rate Limiting

Protect your API from abuse:

### RATE_LIMIT_ENABLED
- **Required:** No
- **Type:** Boolean
- **Description:** Enable rate limiting
- **Default:** `true`

```bash
RATE_LIMIT_ENABLED=true   # Rate limiting on
RATE_LIMIT_ENABLED=false  # Rate limiting off (dev only)
```

### RATE_LIMIT_MAX_REQUESTS
- **Required:** No
- **Type:** Number
- **Description:** Maximum requests per window
- **Default:** `100`

```bash
RATE_LIMIT_MAX_REQUESTS=100   # 100 requests per window
RATE_LIMIT_MAX_REQUESTS=1000  # More permissive
```

### RATE_LIMIT_WINDOW_MS
- **Required:** No
- **Type:** Number (milliseconds)
- **Description:** Time window for rate limiting
- **Default:** `60000` (1 minute)

```bash
RATE_LIMIT_WINDOW_MS=60000   # 1 minute
RATE_LIMIT_WINDOW_MS=3600000 # 1 hour
```

**Example:** With defaults, users can make 100 requests per minute.

---

## Example Configurations

### Local Development (Minimal)

```bash
# .env
NODE_ENV=development
NEXTAUTH_SECRET=generated_secret_here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://safestream:safestream_dev@localhost:5433/safestream
REDIS_URL=redis://localhost:6379
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=master_key_change_me
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
ENABLE_AI=true
ENABLE_TRANSCRIPTION=false
```

### Local Development (Full Features)

```bash
NODE_ENV=development
NEXTAUTH_SECRET=generated_secret_here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://safestream:safestream_dev@localhost:5433/safestream
REDIS_URL=redis://localhost:6379
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=master_key_change_me
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
ENABLE_AI=true
ENABLE_TRANSCRIPTION=true
ENABLE_WEEKLY_DIGEST=false
WHISPER_MODEL=base
MAX_VIDEO_SIZE_MB=500
TRANSCODE_QUALITY=720p
RATE_LIMIT_ENABLED=false
```

### Production (Self-Hosted)

```bash
NODE_ENV=production
NEXTAUTH_SECRET=super_secret_production_key_32_plus_chars
NEXTAUTH_URL=https://safestream.yourdomain.com
DATABASE_URL=postgresql://safestream_prod:secure_db_password@postgres:5432/safestream_prod
REDIS_URL=redis://:secure_redis_password@redis:6379
STORAGE_TYPE=minio
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=production_access_key
MINIO_SECRET_KEY=production_secret_key_very_secure
MINIO_BUCKET_VIDEOS=videos
MINIO_BUCKET_THUMBNAILS=thumbnails
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_KEY=production_meilisearch_key
AI_PROVIDER=ollama
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b
ENABLE_AI=true
ENABLE_TRANSCRIPTION=true
ENABLE_WEEKLY_DIGEST=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
EMAIL_FROM=SafeStream Kids <noreply@yourdomain.com>
DOMAIN=safestream.yourdomain.com
ACME_EMAIL=admin@yourdomain.com
WHISPER_MODEL=base
MAX_VIDEO_SIZE_MB=1000
TRANSCODE_QUALITY=1080p
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Production (AWS)

```bash
NODE_ENV=production
NEXTAUTH_SECRET=super_secret_production_key_32_plus_chars
NEXTAUTH_URL=https://safestream.yourdomain.com
DATABASE_URL=postgresql://username:password@my-db.abc123.us-east-1.rds.amazonaws.com:5432/safestream
REDIS_URL=rediss://default:password@my-redis.abc123.cache.amazonaws.com:6380
STORAGE_TYPE=minio
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
MINIO_BUCKET_VIDEOS=my-safestream-videos
MINIO_BUCKET_THUMBNAILS=my-safestream-thumbnails
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your_openai_api_key
ENABLE_AI=true
ENABLE_TRANSCRIPTION=true
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=AWS_SES_SMTP_PASSWORD
EMAIL_FROM=SafeStream Kids <noreply@yourdomain.com>
DOMAIN=safestream.yourdomain.com
ACME_EMAIL=admin@yourdomain.com
MAX_VIDEO_SIZE_MB=1000
TRANSCODE_QUALITY=1080p
RATE_LIMIT_ENABLED=true
```

---

## Validation

Check your configuration:

```bash
# Verify all required variables are set
pnpm health:check

# Test database connection
pnpm db:migrate

# Test Redis connection
docker exec safestream-redis redis-cli ping

# Test storage
pnpm health:api
```

---

## Security Best Practices

1. **Never commit secrets:**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Use strong secrets:**
   - Generate with `openssl rand -base64 32`
   - Minimum 32 characters
   - Change defaults in production

3. **Different secrets per environment:**
   - Dev, staging, and production should have different secrets
   - Rotate secrets regularly

4. **Secure production credentials:**
   - Use environment variable injection (not .env files)
   - Use secrets managers (AWS Secrets Manager, HashiCorp Vault)
   - Restrict database access by IP

5. **Enable HTTPS:**
   - Always use SSL/TLS in production
   - Set `MINIO_USE_SSL=true`
   - Use `https://` URLs

6. **Rate limiting:**
   - Always enable in production
   - Adjust limits based on usage patterns

---

## Troubleshooting

**Issue: Variable not being read**
- Check `.env` file exists
- Check variable name spelling
- Restart application after changes
- Check if variable needs `NEXT_PUBLIC_` prefix

**Issue: Database connection fails**
- Verify DATABASE_URL format
- Check PostgreSQL is running: `docker ps`
- Test connection: `pnpm health:check`

**Issue: Redis connection fails**
- Verify REDIS_URL format
- Check Redis is running: `docker exec safestream-redis redis-cli ping`

**Issue: Storage not working**
- Check STORAGE_TYPE is set correctly
- Verify credentials/permissions
- Check health endpoint: `pnpm health:api`

---

## References

- [Setup Guide](./SETUP_GUIDE.md) - Complete installation guide
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Redis Connection Strings](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md)

---

**Last Updated:** January 10, 2026

**Need help?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or [open an issue](https://github.com/yourusername/safestream-kids/issues).
