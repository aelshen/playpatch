# Testing Guide - SafeStream Kids

## Quick Test Scenarios

### 1. Basic Authentication Flow

**Test the demo account:**
```
1. Navigate to http://localhost:3000
2. Sign in with:
   - Email: admin@safestream.local
   - Password: password123
3. Verify you land on /admin/dashboard
4. Check that the dashboard shows:
   - Child profiles (Tara & Eddie)
   - Recent activity stats
   - Quick actions
```

### 2. Child Profile Management

**Create a new profile:**
```bash
# From admin dashboard
1. Click "Profiles" in sidebar
2. Click "Create New Profile"
3. Fill in:
   - Name: "Test Child"
   - Birth Date: [any date]
   - Theme: [pick any]
   - Optional: Set a PIN
4. Save and verify profile appears in list
```

**Edit existing profile:**
```bash
1. Go to Profiles
2. Click "Edit" on Tara or Eddie
3. Change theme or other settings
4. Save and verify changes persist
```

### 3. Video Import Workflow

**Import a YouTube video:**
```bash
1. Go to Content → Import Video
2. Paste a kid-friendly YouTube URL (e.g., Sesame Street, PBS Kids)
3. Click "Import"
4. Video should appear in Content list with status "PENDING"
5. Check docker logs: pnpm docker:logs
   - Should see download worker processing the video
```

**Approve/Reject videos:**
```bash
1. Go to Content → Approval Queue
2. Pending videos will appear
3. Expand a video card
4. Review the preview and metadata
5. Select age rating and categories
6. Click "Approve" or "Reject"
7. Verify video moves to appropriate status
```

### 4. Database Operations

**Reset database for clean testing:**
```bash
pnpm db:reset
# This will:
# - Drop and recreate database
# - Apply schema
# - Re-seed with demo data
```

**Explore database in Prisma Studio:**
```bash
pnpm db:studio
# Opens GUI at http://localhost:5555
# Browse all tables, edit records, run queries
```

### 5. Service Health Checks

**Check all services:**
```bash
pnpm status
# Shows status of all Docker services and connections
```

**View logs for debugging:**
```bash
pnpm docker:logs                    # All services
docker logs safestream-postgres     # Just PostgreSQL
docker logs safestream-redis        # Just Redis
docker logs safestream-ollama       # Just Ollama
```

## Common Test Data

### Demo Users
```javascript
{
  email: "admin@safestream.local",
  password: "password123",
  role: "ADMIN",
  children: [
    {
      name: "Tara",
      age: 3,
      uiMode: "TODDLER",
      theme: "rainbow"
    },
    {
      name: "Eddie",
      age: 6,
      uiMode: "EXPLORER",
      theme: "space"
    }
  ]
}
```

### Safe YouTube URLs for Testing
```
Educational:
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (Alphabet Song)
- https://www.youtube.com/watch?v=... (Sesame Street clips)

Science:
- https://www.youtube.com/watch?v=... (SciShow Kids)
- https://www.youtube.com/watch?v=... (Crash Course Kids)

Note: Replace with actual kid-friendly URLs
```

## Testing Workflows

### New Developer Setup Test

**Simulate a fresh developer setup:**
```bash
# 1. Clean slate
pnpm docker:clean
rm -rf node_modules
rm -rf apps/web/node_modules
rm .env apps/web/.env

# 2. Run setup
pnpm setup

# 3. Start dev server
pnpm dev

# 4. Test sign-in
# Navigate to http://localhost:3000
# Sign in with demo credentials
```

### Data Reset Test

**Test database reset functionality:**
```bash
# 1. Make some changes (create profiles, import videos)
# ...

# 2. Reset database
pnpm db:reset

# 3. Verify clean state
# - Only demo user exists
# - Only Tara & Eddie profiles exist
# - No videos or collections
```

### API Testing

**Test API endpoints directly:**
```bash
# Health check
curl http://localhost:3000/api/health

# Auth (should redirect to sign-in)
curl -I http://localhost:3000/admin/dashboard

# After signing in, test with cookie:
# (Copy cookie from browser dev tools)
curl -H "Cookie: next-auth.session-token=..." \
     http://localhost:3000/api/profiles
```

## Performance Testing

### Database Query Performance

```bash
# Open Prisma Studio
pnpm db:studio

# Create test data:
# 1. Create 10+ child profiles
# 2. Import 20+ videos
# 3. Create watch sessions

# Monitor query performance in Next.js dev console
# Check for N+1 queries
```

### Video Processing Load

```bash
# Import multiple videos simultaneously
# Monitor with:
docker stats safestream-postgres safestream-redis

# Watch worker logs:
docker logs -f safestream-web
```

## Debugging Tips

### Frontend Issues

```javascript
// Enable verbose logging in browser console
localStorage.setItem('debug', '*')

// React Query devtools are enabled in dev mode
// Press Cmd+Shift+D to toggle
```

### Backend Issues

```bash
# Check Next.js API route logs
pnpm dev
# All console.log/error output appears in terminal

# Check database connections
docker exec -it safestream-postgres psql -U safestream -d safestream
\dt              # List tables
\d "User"        # Describe User table
SELECT * FROM "User";  # Query users
```

### Docker Issues

```bash
# Check container status
docker ps -a

# Inspect container
docker inspect safestream-postgres

# Enter container shell
docker exec -it safestream-postgres /bin/sh

# Check network connectivity
docker network inspect safestream_network
```

## Automated Testing (TODO)

### Unit Tests

```bash
pnpm test
# Runs Jest tests for:
# - Utility functions
# - React components (with React Testing Library)
# - API routes
```

### E2E Tests

```bash
pnpm test:e2e
# Runs Playwright tests for:
# - Authentication flow
# - Profile management
# - Video import and approval
# - Child interface navigation
```

### Integration Tests

```bash
pnpm test:integration
# Tests:
# - Database operations
# - Worker queues
# - External API integrations
```

## Test Checklist

Before submitting a PR or deploying, verify:

- [ ] `pnpm status` - All services healthy
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm lint` - No linting errors
- [ ] `pnpm test` - All unit tests pass
- [ ] Manual testing of changed features
- [ ] `pnpm db:reset` - Database resets cleanly
- [ ] Dev server starts without errors
- [ ] Sign-in flow works
- [ ] Basic CRUD operations work

## Getting Help

If tests fail or you encounter issues:

1. Check the logs: `pnpm docker:logs`
2. Verify services: `pnpm status`
3. Reset everything: `pnpm docker:clean && pnpm setup`
4. Check QUICKSTART.md for common issues
5. Review error messages carefully - they usually point to the issue

Happy testing! 🧪
